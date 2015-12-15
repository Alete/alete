var express = require('express'),
    passport = require('passport');

module.exports = (function() {
    var app = express.Router();

    function ensureMainSite(req, res, next) {
        if(!res.locals.subDomain){
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

    return app;
 })();
