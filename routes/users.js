const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../Models/userModel');
const router = express.Router();

router.get('/', function(req, res) {
  res.send('RentACar customer routes are available.');
});

router.get('/login', (req, res) => res.render('user/login'));

router.get('/cars', (req, res) => res.render('user/cars'));
router.get('/cart', (req, res) => res.render('user/cart'));
router.get('/brand', (req, res) => res.render('user/brand'));
router.get('/carslist', (req, res) => res.render('user/carslist'));
router.get('/list', (req, res) => res.render('user/list'));
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
    req.session.userId = user._id.toString();
    req.session.userName = user.fullname;
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
    if (!user) return res.status(401).send('Email or password is incorrect.');
    let valid = false;
    if (user.password.startsWith('$2')) {
      valid = await bcrypt.compare(password, user.password);
    } else {
      // Upgrade a legacy plaintext password only after a successful login.
      valid = password === user.password;
      if (valid) {
        user.password = password;
        await user.save();
      }
    }
    if (!valid) return res.status(401).send('Email or password is incorrect.');
    req.session.userId = user._id.toString();
    req.session.userName = user.fullname;
    return res.redirect('/fleet');
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie('rentacar.sid');
    res.redirect('/');
  });
});

module.exports = router;
