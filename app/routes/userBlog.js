var express  = require('express');

module.exports = (function() {
    var app = express.Router();

    app.get('/', function(req, res, next){
        if(res.locals.subDomain){
            if(res.locals.userBlog){
                res.send('blog exists');
            } else {
                res.send('blog doesn\'t exist');
            }
        } else {
            next();
        }
    });

    return app;
})();
