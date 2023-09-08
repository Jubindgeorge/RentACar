var express = require('express');
let usermodel = require('../Models/userModel')
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/login',(req,res)=>{
  res.render('user/login');
  });
 
        router.get('/cars',(req,res)=>{
          res.render('user/cars');
        });
        router.get('/cart',(req,res)=>{
        res.render('user/cart');
        });
        
              router.get('/brand',(req,res)=>{
              res.render('user/brand');
               });
            router.get('/carslist',(req,res)=>{
              res.render('user/carslist');
              });
              router.get('/list',(req,res)=>{
                res.render('user/list');
                });
                router.get('/About',(req,res)=>{
                  res.render('user/About');
                  });
                router.post('/register',async (req,res)=>{
                  console.log(req.body)
                  try {
                    let data = await usermodel.create(req.body) 
                    console.log("data inserted")
                  } catch (error) {
                    console.log(error)
                  }
                })
                router.post('/loginin',(req,res)=>{
                  console.log(req.body)
                })
module.exports = router;
