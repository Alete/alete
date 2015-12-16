var express = require('express'),
    jade = require('jade'),
    async = require('async'),
    Theme = require('../models/Theme');

module.exports = (function() {
    var app = express.Router();

    function ensureBlog(req, res, next) {
        if(res.locals.blog.url){
            next();
        } else {
            next('route');
        }
    }

    function ensureBlogExists(req, res, next) {
        if(res.locals.blog.url){
            next();
        } else {
            next('blog doesn\'t exist');
        }
    }

    function redirectToCustomDomain(req, res, next) {
        if(res.locals.blog.customDomain && res.locals.domain !== res.locals.blog.customDomain){
            res.redirect('http://' + res.locals.blog.customDomain);
        } else {
            next();
        }
    }

    app.get('/', ensureBlog, ensureBlogExists, redirectToCustomDomain, function(req, res, next){
        async.waterfall([
            function(callback) {
                Theme.findOne({
                    url: res.locals.blog.url
                }).lean().sort('date').exec(function(err, theme){
                    if(err) { next(err); }
                    callback(null, theme);
                });
            }, function(theme, callback) {
                if(!theme){
                    Theme.findOne({
                        url: '============='
                    }).lean().sort('data').exec(function(err, theme){
                        if(err) { next(err); }
                        callback(null, theme);
                    });
                } else {
                    callback(null, theme);
                }
            }
        ], function(err, theme) {
            if(err) { next(err); }
            if(theme){
                // Add any extras we need to locals
                // We use if statments as we don't want to
                // override their own vars
                if(!theme.locals.url){
                    theme.locals.url = res.locals.blog.url;
                }

                var fn = jade.compile(theme.jade, {});
                var html = fn(theme.locals);
                res.send(html);
            } else {
                next('The default theme is missing!');
            }
        });
    });

    return app;
})();
