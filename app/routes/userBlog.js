var express = require('express'),
    jade = require('jade'),
    Theme = require('../models/Theme');

module.exports = (function() {
    var app = express.Router();

    function ensureBlog(req, res, next) {
        if(res.locals.subDomain){
            next();
        } else {
            next('route');
        }
    }

    function ensureBlogExists(req, res, next) {
        if(res.locals.userBlog){
            next();
        } else {
            next('blog doesn\'t exist');
        }
    }

    app.get('/', ensureBlog, ensureBlogExists, function(req, res, next){
        Theme.findOne({
            url: res.locals.subDomain
        }).lean().sort('date').exec(function(err, theme){
            if(err) { next(err); }
            if(theme){
                var fn = jade.compile(theme.jade, {});
                var html = fn(theme.locals);
                res.send(html);
            } else {
                Theme.findOne({
                    url: '============='
                }).lean().sort('data').exec(function(err, theme){
                    if(err) { next(err); }
                    if(theme){
                        var fn = jade.compile(theme.jade, {});
                        var html = fn(theme.locals);
                        res.send(html);
                    } else {
                        next('The default theme is missing!');
                    }
                });
            }
        });
    });

    return app;
})();
