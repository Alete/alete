var express  = require('express');

module.exports = (function() {
    var app = express.Router();

    app.get('/', function(req, res, next){
        if(!res.locals.subDomain){
            res.send('main site');
        } else {
            next();
        }
    });

    return app;
})();
