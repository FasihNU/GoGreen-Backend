var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
const mongoDB = require('./config/db');
const mongoose = require('mongoose');

var app = express();


// setting up session

app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());


// setting up passport
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});




const headerMiddleware = require("./middlewares/HeaderMiddleware");
app.use(headerMiddleware);



var DB_URL;

DB_URL="mongodb://localhost:27017/GoGreen";
console.log("DB_URL : " + DB_URL);

const connect = mongoose.connect(DB_URL, {autoIndex: false});
// connecting to the database
connect.then((db) => {
    console.log("Connected to the MongoDB server");
}, (err) => { console.log(err); });



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



// Routers

var userAuthRouter = require('./routes/userAuthRouter');
var mapProtectedRouter = require('./routes/mapProtectedRouter');
var userRouter = require('./routes/userRouter');
var indexRouter = require('./routes/index');



const { allowedNodeEnvironmentFlags } = require('process');


app.use('/public',express.static('public'));

app.use('/', indexRouter);
app.use('/auth/user', userAuthRouter);
app.use('/map', mapProtectedRouter);
app.use('/user', userRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
