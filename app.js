var express = require('express');
var path = require('path');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var crypto = require('crypto');
var logger = require('morgan');
var hbs = require('hbs');
var con = require('./config/config');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');

var app = express();
app.disable('x-powered-by');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
var partialsDir = path.join(__dirname, 'views/partials');
// Older repository versions may not contain a partials directory.
// Register it only when it exists so the app can still boot cleanly.
if (fs.existsSync(partialsDir)) hbs.registerPartials(partialsDir);
app.use(logger('dev'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());
app.use(session({
  name: 'rentacar.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Start the database connection; the health endpoint reports readiness accurately.
con().catch(error => {
  console.error('MongoDB startup failed:', error.message);
});

app.use('/api', apiRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use(function(req, res, next) {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found.' });
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use(function(err, req, res, next) {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  if (req.path.startsWith('/api/')) {
    if (status >= 500) console.error('API request failed:', err.message);
    return res.status(status).json({
      error: status >= 500 ? 'A server error occurred. Check the server logs.' : err.message,
      ...(err.name === 'ValidationError' ? { details: Object.values(err.errors).map(item => item.message) } : {})
    });
  }
  res.locals.message = status >= 500 ? 'Something went wrong.' : err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(status).render('error');
});

module.exports = app;
