var express = require('express');
var app = express();
//var exphbs = require('express-handlebars');
var exphbs = require('express-secure-handlebars');
var bodyParser = require('body-parser');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var session = require('express-session');
var multer = require('multer');
var passport = require('passport');

var shop = require('./routes/index');
var checkout = require('./routes/checkout');
var account = require('./routes/account');

app.engine('handlebars',exphbs({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(multer({ dest: 'public/tmp'}));
app.use(express.static('public'));
//httpOnly: false
app.use(session({secret: 'ierg4210liquanquanshop', cookie: { maxAge : 3600000, httpOnly: true }, resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

var initPassport = require('./passport/init');
initPassport(passport);

var admin = require('./routes/admin')(passport);
var checkout = require('./routes/checkout')(passport);
var account = require('./routes/account')(passport);

app.use('/', function(req, res, next) {
var schema = req.headers['x-forwarded-proto'];
if (schema === 'https') {
    // Already https; don't do anything special.
    next();
}
else {
// Redirect to https.
res.redirect('https://' + req.headers.host + req.url);
}
});

// app.use('/admin', function(req, res, next) {
//     var schema = req.headers['x-forwarded-proto'];
//     if (schema === 'https') {
//         // Already https; don't do anything special.
//         next();
//     }
//     else {
//         // Redirect to https.
//         res.redirect('https://' + req.headers.host + req.url + '/admin');
//     }
// });

app.use('/admin', admin);
app.use('/checkout',checkout);
app.use('/account',account);
app.use('/',shop);


//catch 404 and forward to error handler
app.use(function(req, res, next){
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});


if (app.get('env') === 'development'){
    console.log('development\n');
}
else{
    console.log('production\n');
}

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
