var LocalStrategy = require('passport-local').Strategy,
    TotpStrategy = require('passport-totp').Strategy,
    base32 = require('thirty-two'),
    User = require('../models/User'),
    AccessToken = require('../models/AccessToken');

exports = module.exports = function(app, passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use('local-signin', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
    }, function(email, password, done) {
        User.findOne({
            email: email
        }, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false, { message: 'Unknown user ' + email }); }
            user.comparePassword(password, function(err, isMatch) {
                if (err) { return done(err); }
                if(isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Invalid password' });
                }
            });
        });
    }));

    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        process.nextTick(function() {
            if(req.body.accessToken){
                AccessToken.findOne({
                    _id: req.body.accessToken
                }).exec(function(err, accessToken){
                    if(err) { done(err); }
                    if(accessToken){
                        if(accessToken.used){
                            done('The token is already used!');
                        } else {
                            User.findOne({
                                $or: [
                                    {
                                        email: email
                                    },
                                    {
                                        url: req.body.url
                                    }
                                ]
                            }, function(err, user) {
                                if (err) { return done(err); }
                                if (user) {
                                    return done(null, false, { message: 'That email is already in use or the URL is taken.' });
                                } else {
                                    user = new User({
                                        email: email,
                                        password: password,
                                        url: req.body.url
                                    });
                                    user.save(function(err, user) {
                                        if (err) { throw err; }
                                        return done(null, user);
                                    });
                                }
                            });
                        }
                    } else {
                        return done(null, false, {
                            message: 'That accessToken doesn\'t exist'
                        });
                    }
                });
            } else {
                return done(null, false, {
                    message: 'You\'re missing your accessToken'
                });
            }
        });
    }));

    passport.use(new TotpStrategy(function(user, done) {
        // The user object carries all user related information, including
        // the shared-secret (key) and password.
        var key = user.key;
        if(!key) {
            return done(new Error('No key'));
        } else {
            return done(null, base32.decode(key), 30); //30 = valid key period
        }
    }));
};
