var express = require('express'),
    base32 = require('thirty-two'),
    crypto = require('crypto'),
    passport = require('passport'),
    User = require('../models/User');

module.exports = (function() {
    var app = express.Router();

    function ensureMainSite(req, res, next) {
        if(!res.locals.subDomain){
            next();
        } else {
            next('route');
        }
    }

    function isLoggedIn(req, res, next) {
        if(req.isAuthenticated()) {
            next();
        } else {
            res.redirect('/signin');
        }
    }

    function ensureOtp(req, res, next) {
        if((req.user.key && req.session.method === 'otp') || (!req.user.key && req.session.method === 'plain')) {
            next();
        } else {
            res.redirect('/');
        }
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomKey(len) {
        var buf = [],
            chars = 'abcdefghijklmnopqrstuvwxyz0123456789',
            charlen = chars.length;

        for (var i = 0; i < len; ++i) {
            buf.push(chars[getRandomInt(0, charlen - 1)]);
        }

        return buf.join('');
    }

    app.get('/signin', ensureMainSite, function(req, res){
        res.render('signin');
    });

    app.get('/signup', ensureMainSite, function(req, res){
        res.render('signup');
    });

    app.post('/signin', ensureMainSite, passport.authenticate('local-signin', {
        failureRedirect : '/signin', // redirect back to the signup page if there is an error
        failureFlash : false // allow flash messages
    }), function(req, res) {
        if(req.user.otp.key) {
            req.session.method = 'otp';
            res.redirect('/otp-input');
        } else {
            req.session.method = 'plain';
            res.redirect('/');
        }
    });

    app.post('/signup', ensureMainSite, passport.authenticate('local-signup', {
        successRedirect : '/',
        failureRedirect : '/signup',
        failureFlash : false // allow flash messages
    }));

    app.get('/signout', ensureMainSite, function(req, res){
        req.logout();
        res.redirect('/');
    });

    app.get('/otp-setup', isLoggedIn, function(req, res, next){
        User.findOne({
            _id: req.user.id
        }, function(err, user) {
            if (err) { return next(err); }
            var encodedKey = null,
                otpUrl = null,
                qrImage = null;
            if(user.otp.key) {
                // two-factor auth has already been setup
                encodedKey = base32.encode(user.otp.key);

                // generate QR code for scanning into Google Authenticator
                // reference: https://code.google.com/p/google-authenticator/wiki/KeyUriFormat
                otpUrl = 'otpauth://totp/' + req.user.email + '?secret=' + encodedKey + '&period=' + (user.otp.period || 30);
                qrImage = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + encodeURIComponent(otpUrl);

                res.render('otp-setup', {
                    user: req.user,
                    key: encodedKey,
                    qrImage: qrImage
                });
            } else {
                // new two-factor setup. generate and save a secret key
                var key = randomKey(10);
                encodedKey = base32.encode(key);

                // generate QR code for scanning into Google Authenticator
                // reference: https://code.google.com/p/google-authenticator/wiki/KeyUriFormat
                otpUrl = 'otpauth://totp/' + req.user.email + '?secret=' + encodedKey + '&period=30';
                qrImage = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + encodeURIComponent(otpUrl);

                User.update({
                    _id: req.user._id
                }, {
                    $set: {
                        'otp.key': key,
                        'otp.period': 30
                    }
                }).exec(function(err, user){
                    if(err) { return next(err); }
                    if(user){
                        res.render('otp-setup', {
                            user: req.user,
                            key: encodedKey,
                            qrImage: qrImage
                        });
                    }
                });
            }
        });
    });

    app.get('/otp-input', isLoggedIn, function(req, res, next) {
        // If user hasn't set up two-factor auth, redirect
        User.findOne({
            _id: req.user._id
        }).exec(function(err, user){
            if (err) { return next(err); }
            if (!user.otp.key) {
                res.redirect('/otp-setup');
            } else {
                res.render('otp-input', {
                    user: req.user
                });
            }
        });
    });

    app.post('/otp-input', isLoggedIn, ensureOtp, function(req, res){
        if(req.body.otp) {
            req.session.method = 'otp';

            var secret = base32.encode(crypto.randomBytes(16));
            //Discard equal signs (part of base32,
            //not required by Google Authenticator)
            //Base32 encoding is required by Google Authenticator.
            //Other applications
            //may place other restrictions on the shared key format.
            secret = secret.toString().replace(/=/g, '');
            req.user.key = secret;
        } else {
            req.session.method = 'plain';
            req.user.key = null;
        }

        res.redirect('/otp-setup');
    });

    return app;
 })();
