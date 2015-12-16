var express = require('express'),
    User = require('../models/User');

module.exports = (function() {
    var app = express.Router();

    app.use(function(req, res, next){
        var host = req.headers.host.replace(/^www\./,''),
            domain = host.split(':')[0],
            port = host.split(':')[1],
            blog = domain.substring(0, domain.lastIndexOf('.al.xyz'));

        res.locals.host = host;
        res.locals.port = port;
        res.locals.domain = domain;
        res.locals.blog = {};
        res.locals.blog.url = blog;
        res.locals.user = req.user;
        res.locals.currentPage = req.path;

        var criteria = domain.indexOf('.al.xyz') > 0 ? { url: blog } : { customDomain: domain };

        User.findOne(criteria).exec(function(err, user){
            if(err) {
                next(err);
            } else {
                if(user){
                    res.locals.blog.url = user.url;
                    res.locals.blog.followers = 1;
                    res.locals.blog.customDomain = user.customDomain;
                }
                next();
            }
        });
    });

    return app;
})();
