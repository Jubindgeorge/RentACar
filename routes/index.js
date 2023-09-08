var express = require('express');
var router = express.Router();
// var checkUser = require('../middleware/checkUser')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'RideOn' });
});

  router.get('/adminlogin',(req,res)=>{
    res.render('admin/adminlogin');
    });
   
        router.get('/adminhome',(req,res)=>{
          res.render('admin/adminhome');
          });
        router.get('/addproducts',(req,res)=>{
          res.render('admin/addproducts');
          });
          
module.exports = router;
