const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../Models/userModel');
const LoginActivity = require('../Models/loginActivityModel');
const router = express.Router();

async function recordActivity(req, event, email, userId) {
  try {
    await LoginActivity.create({
      event, email: String(email || '').slice(0, 254), user: userId || null,
      ipAddress: String(req.ip || '').slice(0, 80),
      userAgent: String(req.get('user-agent') || '').slice(0, 400)
    });
  } catch (error) {
    console.error('Could not record login activity:', error.message);
  }
}

// Prevent session fixation by issuing a fresh session ID after authentication.
function establishUserSession(req, user, email) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(error => {
      if (error) return reject(error);
      req.session.userId = user._id.toString();
      req.session.userName = user.fullname;
      req.session.userEmail = email;
      req.session.save(saveError => saveError ? reject(saveError) : resolve());
    });
  });
}

router.get('/', function(req, res) {
  res.send('RentACar customer routes are available.');
});

router.get('/login', (req, res) => res.render('user/login'));

router.get('/cars', (req, res) => res.redirect('/fleet'));
router.get('/cart', (req, res) => res.render('user/cart'));
router.get('/brand', (req, res) => res.redirect('/fleet'));
router.get('/carslist', (req, res) => res.redirect('/fleet'));
router.get('/list', (req, res) => res.redirect('/fleet'));
router.get('/About', (req, res) => res.render('user/About'));

router.post('/register', async (req, res, next) => {
  try {
    const fullname = String(req.body.fullname || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!fullname || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return res.status(400).send('Enter a valid name and email, and a password with at least 8 characters.');
    }
    const user = await User.create({ fullname, email, password });
    await establishUserSession(req, user, email);
    await recordActivity(req, 'register_success', email, user._id);
    return res.redirect('/fleet');
  } catch (error) {
    if (error.code === 11000) return res.status(409).send('An account with this email already exists. Please sign in.');
    next(error);
  }
});

router.post('/loginin', async (req, res, next) => {
  try {
    const email = String(req.body.Email || req.body.email || '').trim().toLowerCase();
    const password = String(req.body.Password || req.body.password || '');
    if (!email || !password) return res.status(400).send('Enter your email and password.');
    const user = await User.findOne({ email }).select('+password');
    if (!user) { await recordActivity(req, 'login_failed', email, null); return res.status(401).send('Email or password is incorrect.'); }
    let valid = false;
    if (user.password.startsWith('$2')) {
      valid = await bcrypt.compare(password, user.password);
    } else {
      // Upgrade a legacy plaintext password only after a successful login.
      valid = password === user.password;
      if (valid) {
        user.password = password;
        user.markModified('password');
        await user.save();
      }
    }
    if (!valid) { await recordActivity(req, 'login_failed', email, user._id); return res.status(401).send('Email or password is incorrect.'); }
    await establishUserSession(req, user, email);
    await recordActivity(req, 'login_success', email, user._id);
    return res.redirect('/fleet');
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  const userId = req.session.userId;
  const email = req.session.userEmail || '';
  req.session.destroy(async error => {
    if (error) return next(error);
    try { await LoginActivity.create({ event: 'logout', email, user: userId || null, ipAddress: String(req.ip || '').slice(0, 80), userAgent: String(req.get('user-agent') || '').slice(0, 400) }); } catch (logError) { console.error('Could not record logout:', logError.message); }
    res.clearCookie('rentacar.sid');
    res.redirect('/');
  });
});

module.exports = router;
