var express  = require('express'),
    User = require('../models/User');

module.exports = (function() {
    var app = express.Router();

    app.use(function(req, res, next){
        var host = req.headers.host.replace(/^www\./,''),
            domain = host.split(':')[0],
            port = host.split(':')[1],
            subDomain = domain.substring(0, domain.lastIndexOf('.alete.xyz'));

        res.locals.host = host;
        res.locals.port = port;
        res.locals.domain = domain;
        res.locals.subDomain = subDomain;
        res.locals.user = req.user;
        res.locals.currentPage = req.path;

        User.findOne({
            url: subDomain
        }).exec(function(err, user){
            if(err) {
                next(err);
            } else {
                if(user){
                    res.locals.userBlog = user.url;
                }
                next();
            }
        });
    });

    return app;
})();
