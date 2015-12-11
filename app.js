var express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    compression = require('compression'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    nconf = require('nconf'),
    cluster = require('cluster'),
    numCPUs = require('os').cpus().length;

nconf.use('memory');

nconf.argv().env().file({ file: './config.json' });

mongoose.connect('mongodb://' + nconf.get('database:host') + ':' + nconf.get('database:port') + '/' + nconf.get('database:collection'), function(err){
    if(err){ console.log('Cannot connect to mongodb, please check your config.json'); process.exit(1); }
});

var app = express();

app.disable('x-powered-by');

app.set('views', __dirname + '/app/views');
app.set('view engine', 'jade');
app.use(compression());
app.use(express.static(__dirname + '/public', { maxAge: 86400000 }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({
    secret: nconf.get('session:secret'),
    name: 'session',
    store: new MongoStore({mongooseConnection: mongoose.connection}),
    proxy: true,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/', require('./app/routes/api'));

app.use(function(req, res, next){
    var host = req.headers.host,
        domain = host.split(':')[0],
        port = host.split(':')[1],
        subDomain = domain.substring(0, domain.lastIndexOf('.alete.xyz'));

    res.locals.host = host;
    res.locals.port = port;
    res.locals.domain = domain;
    res.locals.subDomain = subDomain;
    res.locals.user = req.user;
    res.locals.layout = {
        currentPage: req.path
    };
    next();
});

require('./app/config/passport.js')(app, passport);

app.use('/', require('./app/routes/auth'));
app.use('/', require('./app/routes/web'));

// Handle 404
app.use(function(req, res) {
    res.status(404);
    res.render('http/404', {
        title: '404: File Not Found'
    });
});

// Handle 500
app.use(function(error, req, res) {
    res.status(500);
    res.render('http/500', {
        title: '500: Internal Server Error',
        error: error
    });
});
if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
    app.listen(nconf.get('web:port'), function() {
        console.log('The server is running on port %s', nconf.get('web:port'));
    });
}
