var express = require('express'),
    async = require('async'),
    crypto = require('crypto'),
    nconf = require('nconf'),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    User = require('../models/User'),
    passport = require('passport');

module.exports = (function() {
    var app = express.Router();

    function ensureMainSite(req, res, next) {
        if(!Object.keys(res.locals.blog).length){
            next();
        } else {
            next('route');
        }
    }

    app.get('/signin', ensureMainSite, function(req, res){
        res.render('signin');
    });

    app.get('/signup', ensureMainSite, function(req, res){
        res.render('signup');
    });

    app.post('/signin', ensureMainSite, passport.authenticate('local-signin', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/signin', // redirect back to the signup page if there is an error
        failureFlash : false // allow flash messages
    }));

    app.post('/signup', ensureMainSite, passport.authenticate('local-signup', {
        successRedirect : '/',
        failureRedirect : '/signup',
        failureFlash : false // allow flash messages
    }));

    app.get('/signout', ensureMainSite, function(req, res){
        req.logout();
        res.redirect('/');
    });

    app.get('/forgot', function(req, res){
        res.render('forgot');
    });

    app.post('/forgot', function(req, res, next) {
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            }, function(token, done) {
                User.findOne({
                    email: req.body.email
                }, function(err, user) {
                    if (!user) {
                        req.flash('error', 'No account with that email address exists.');
                        return res.redirect('/forgot');
                    }

                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 600000; // 10 minutes

                    user.save(function(err) {
                        done(err, token, user);
                    });
                });
            }, function(token, user, done) {
                var transporter = nodemailer.createTransport(smtpTransport({
                    host: 'box.alete.xyz',
                    port: 587,
                    auth: {
                        user: nconf.get('email:address'),
                        pass: nconf.get('email:password')
                    }
                }));
                var mailOptions = {
                    to: user.email,
                    from: 'hello@alete.xyz',
                    subject: 'Alete Password Reset',
                    text:
                    'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste it into your browser to complete the process:\n\n' +
                    'https://alete.xyz/reset/' + token + '\n\n' +
                    'If you did not request this, please reply to this email so we can block further unauthorised attempts to reset your password.\n'
                };
                transporter.sendMail(mailOptions, function(err) {
                    if(err) {
                        req.flash('err', err);
                    } else {
                        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                        done(err, 'done');
                    }
                });
            }
        ], function(err) {
            if (err) { return next(err); }
            res.redirect('/forgot');
        });
    });

    app.get('/reset/:token', function(req, res) {
        User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        }, function(err, user) {
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/forgot');
            }
            res.render('reset', {
                user: req.user
            });
        });
    });

    app.post('/reset/:token', function(req, res, next) {
        async.waterfall([
            function(done) {
                User.findOne({
                    resetPasswordToken: req.params.token,
                    resetPasswordExpires: {
                        $gt: Date.now()
                    }
                }, function(err, user) {
                    if (!user) {
                        req.flash('error', 'Password reset token is invalid or has expired.');
                        return res.redirect('back');
                    }

                    user.password = req.body.password;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;

                    user.save(function(err) {
                        if(err) { done(err); }
                        req.logIn(user, function(err) {
                            done(err, user);
                        });
                    });
                });
            }, function(user, done) {
                var transporter = nodemailer.createTransport(smtpTransport({
                    host: 'box.alete.xyz',
                    port: 587,
                    auth: {
                        user: nconf.get('email:address'),
                        pass: nconf.get('email:password')
                    }
                }));
                var mailOptions = {
                    to: user.email,
                    from: 'hello@alete.xyz',
                    subject: 'Your password has been changed',
                    text: 'Hello,\n\n' + 'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                transporter.sendMail(mailOptions, function(err) {
                    if(err) {
                        req.flash('err', err);
                    } else {
                        req.flash('success', 'Success! Your password has been changed.');
                        done(err);
                    }
                });
            }
        ], function(err) {
            if(err) { next(err); }
            res.redirect('/');
        });
    });


    return app;
 })();
