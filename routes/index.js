var express = require('express');
var router = express.Router();
// var checkUser = require('../middleware/checkUser')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'RideOn' });
});

  router.get('/adminlogin', (req, res) => res.redirect('/admin/dashboard'));
   
        router.get('/adminhome', (req, res) => res.redirect('/admin/dashboard'));
        router.get('/addproducts', (req, res) => res.redirect('/admin/dashboard'));
          
router.get('/fleet', (req, res) => res.render('user/fleet'));

// Friendly public aliases for the customer pages.
router.get('/login', (req, res) => res.redirect('/users/login'));
router.get('/cart', (req, res) => res.redirect('/users/cart'));
router.get('/cars', (req, res) => res.redirect('/fleet'));
router.get('/carslist', (req, res) => res.redirect('/fleet'));
router.get('/About', (req, res) => res.redirect('/users/About'));
router.get('/admin/dashboard', (req, res) => res.render('admin/dashboard'));

module.exports = router;
