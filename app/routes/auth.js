var express  = require('express'),
    passport = require('passport');

module.exports = (function() {
    var app = express.Router();

    app.get('/signin', function(req, res, next){
        if(!res.locals.subDomain){
            res.render('signin');
        } else {
            next();
        }
    });

    app.get('/signup', function(req, res, next){
        if(!res.locals.subDomain){
            res.render('signup');
        } else {
            next();
        }
    });

    app.post('/signin', function(req, res, next){
        if(!res.locals.subDomain){
            next();
        } else {
            next('route');
        }
    }, passport.authenticate('local-signin', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/signin', // redirect back to the signup page if there is an error
        failureFlash : false // allow flash messages
    }));

    app.post('/signup', function(req, res, next){
        if(!res.locals.subDomain){
            next();
        } else {
            next('route');
        }
    }, passport.authenticate('local-signup', {
        successRedirect : '/',
        failureRedirect : '/signup',
         failureFlash : false // allow flash messages
    }));

    app.get('/signout', function(req, res, next){
        if(!res.locals.subDomain){
            req.logout();
            res.redirect('/');
        } else {
            next();
        }
    });

    return app;
 })();
