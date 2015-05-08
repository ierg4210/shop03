var models = require('../models');
var express = require('express');
var passport = require('passport');
var csrf = require('csurf');
var router = express.Router();
var paypal = require('paypal-rest-sdk');

module.exports = function(){

  //csrf
  var csrfProtection = csrf({cookie: true});

  //CSP
  router.use(function(req, res, next){
      res.header("Content-Security-Policy", "default-src 'self';script-src 'self';object-src 'none';img-src 'self';media-src 'self';frame-src 'none';font-src 'self' data:;connect-src 'self';style-src 'self'");
      next();
  });

  paypal.configure({
    'mode': '',
    'client_id': '',
    'client_secret': ''
  });

  router.get('/',isLoggedIn, function(req, res){
    var fullUrl = req.protocol + '://' + req.get('host') + req.baseUrl;
    console.log('req.fullUrl', fullUrl);
    var booksToBuy = [];
    var booksToBuy2 = [];
    models.Product.findAll().then(function(products){
      var total = 0;
      products.forEach(function(product){
        var quantity = 0;
        var price = 0;
        //console.log('pid = '+product.id);
        //console.log('query id = '+typeof(req.query.id[1]));
        //console.log('== '+req.query.id.indexOf('1'));
        if(req.query.id.indexOf(product.id.toString()) != -1){
          console.log(product.productName);
          quantity = req.query.quantity[req.query.id.indexOf(product.id.toString())];
          price = parseFloat(Math.round(product.productPrice*100)/100).toFixed(2);
          subtotal = parseFloat(product.productPrice)*parseFloat(quantity);
          total = total + subtotal;
          var bookToBuy = {'sku':req.query.id[req.query.id.indexOf(product.id.toString())], 'name':product.productName, 'price':price,'currency':'USD','quantity':quantity};
          booksToBuy.push(bookToBuy);
        }
      });
      total = parseFloat(Math.round(total*100)/100).toFixed(2);
      console.log("total = "+total);
      var create_payment_json = {
        "intent": "sale",
        "payer":{
          "payment_method":"paypal"
        },
        "redirect_urls":{
          "return_url": fullUrl+"/thankyou",
          "cancel_url": fullUrl+"/error"
        },
        "transactions": [{
          "item_list":{
            "items":booksToBuy
          },
          "amount":{
            "currency":"USD",
            "total": total
          },
          "description": "IERG4210 Shop03"
        }]
      };

      paypal.payment.create(create_payment_json, function(error, payment){
        if(error){
          console.log('error message');
          console.log(error);
          console.log(error.response.details);
        }else{
          console.log('created payment response');
          console.log(payment);
          console.log("payment ID = "+payment.id);
          //update DB
          models.Payment.create({
            userid: req.user.id,
            paymentid: payment.id,
            state: payment.state
          }).then(function(payment){
            console.log('Payment create succesful');
          });
          
          //redirect
          var link = payment.links;
          for(var i=0;i<link.length;i++){
            if(link[i].rel === 'approval_url'){
              console.log('redirect_url == '+link[i].href);
              res.redirect(link[i].href);
            }
          }
        }
      });
    });
  });

  router.get('/thankyou', function(req, res){
    console.log('####thank you page####');
    var paymentId = req.query.paymentId;
    var execute_payment_json = {
      "payer_id": req.query.PayerID
    };

    paypal.payment.execute(paymentId, execute_payment_json, function(error, payment){
    if (error) {
      console.log(error.response);
      res.redirect('error');
    } else {
      console.log("Get Payment Response");
      console.log(JSON.stringify(payment));
      if(payment.state === 'approved'){
        models.Payment.find({where: {paymentid: paymentId}}).then(function(paymentItem){
            paymentItem.updateAttributes({
            state: payment.state
          }).then(function(){console.log("update succesfully");});
        });
        var homeUrl = req.protocol + '://' + req.get('host');
        res.render('checkout_thankyou',{
          homeUrl: homeUrl
        });
      }
      else{
        console.log(error.response);
        res.redirect('error').end();
      }
    }
    });
  });

  router.get('/error', function(req, res){
    console.log('####error page####');
    var token = req.query.token;
    res.render('checkout_error',{
      token: token
    });
  });

  router.get('/login',csrfProtection, function(req, res){
    //console.log("login");
    res.render('login',{ message: req.flash('loginMessage'), csrfToken: req.csrfToken()});
  });

  router.post('/login', csrfProtection, passport.authenticate('login', {
    successRedirect : '/',
    failureRedirect : '/checkout/login',
    failureFlash : true
  }));

  router.get('/*', function(req, res){
    res.redirect('/checkout');
  });

  return router;
}

function isLoggedIn(req, res, next) {
  req.session.returnTo = req.path;
  console.log('########req path##### '+req.path);

  if (req.isAuthenticated())
    return next();
  //return next();
  res.redirect('/checkout/login');
}


