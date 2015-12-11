var express  = require('express');

module.exports = (function() {
    var app = express.Router();

    app.get('/', function(req, res){
        res.send({
            locals: res.locals,
            headers: req.headers
        });
    });

    return app;
})();
