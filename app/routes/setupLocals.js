var express = require('express'),
    Blog = require('../models/Blog');

module.exports = (function() {
    var app = express.Router();

    app.use(function(req, res, next){
        var host = req.headers.host.replace(/^www\./,''),
            domain = host.split(':')[0],
            port = host.split(':')[1],
            currentBlog = domain.substring(0, domain.lastIndexOf('.al.xyz'));

        res.locals.host = host;
        res.locals.port = port;
        res.locals.domain = domain;
        res.locals.blog = {};
        res.locals.user = req.user;
        res.locals.currentPage = req.path;

        var criteria = domain.indexOf('.al.xyz') > 0 ? { url: currentBlog } : { customDomain: domain };

        Blog.findOne(criteria).exec(function(err, blog){
            if(err) {
                next(err);
            } else {
                if(blog){
                    res.locals.blog = blog;
                }
                next();
            }
        });
    });

    return app;
})();
