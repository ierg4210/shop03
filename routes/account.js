var models = require('../models');
var express = require('express');
var passport = require('passport');
var csrf = require('csurf');
var router = express.Router();
var paypal = require('paypal-rest-sdk');
var eventproxy = require('eventproxy');
var bCrypt = require('bcrypt-nodejs');
var EM = require('../modules/emaildispatcher');
var async = require('async');
var crypto = require('crypto');

module.exports = function(){

  paypal.configure({
    'mode': '',
    'client_id': '',
    'client_secret': ''
  });

  //csrf
  var csrfProtection = csrf({cookie: true});
  //CSP
  router.use(function(req, res, next){
      res.header("Content-Security-Policy", "default-src 'self';script-src 'self';object-src 'none';img-src 'self';media-src 'self';frame-src 'none';font-src 'self' data:;connect-src 'self';style-src 'self'");
      next();
  });

  router.get('/',isLoggedIn, function(req, res){
    console.log('user',req.user);
    models.Payment.findAll({
      where:{userid:req.user.id}
    }).then(function(payments){
      res.render('account',{
        user: req.user,
        paymentrecords: payments
      });
    });
  });


  router.get('/login',csrfProtection, function(req, res){
    res.render('login',{ message: req.flash('loginMessage'), csrfToken: req.csrfToken()});
  });

  router.post('/login', csrfProtection, passport.authenticate('login', {
    successRedirect : '/account',
    failureRedirect : '/account/login',
    failureFlash : true
  }));
  
  router.get('/logout', function(req,res){
    req.logout();
    res.redirect('/account');
  });
  
  router.get('/facebook', passport.authenticate('facebook',{scope: 'email'}));
  router.get('/facebook/callback', passport.authenticate('facebook',{
    successRedirect: '/account',
    failureRedirect: '/login'
  }));

  router.get('/history/:paymentid', isLoggedIn, function(req, res) {
    var paymentid = req.param('paymentid');
    console.log(paymentid);
    paypal.payment.get(paymentid, function(error, payment){
    if(error){
      console.error(error);
    } else {
      var items = payment.transactions[0].item_list.items;
      var total = payment.transactions[0].amount.total;
      console.log(payment);
      console.log(items);
      var ep = new eventproxy();
      ep.after('got_record', items.length, function(list){
        console.log('final');
        console.log(list);
        res.render('payment',{
          user: req.user,
          paymentid: paymentid,
          items: list,
          total: total
        });
      });

      items.forEach(function(item){
        models.Product.find({where:{id: item.sku}}).then(function(dbitem){
          console.log(dbitem.id);
          item.image = dbitem.productImage;
          ep.emit('got_record', item);
        });
      });
    }
  });

  });
  router.get('/changepassword', isLoggedIn, csrfProtection, function(req, res){
    console.log('csrfToken: '+req.csrfToken());
    res.render('changepasswd',{csrfToken: req.csrfToken()});
  });
  router.post('/changepassword', isLoggedIn, csrfProtection, function(req, res){
    var currentpassword = req.body.currentpassword;
    var newpassword = req.body.newpassword;
    var newpasswordagain = req.body.newpasswordagain;
    if (newpassword === newpasswordagain){
      //do
      console.log('user',req.user.password);
      if (bCrypt.compareSync(currentpassword, req.user.password)){
        //update db
        console.log('update db');
        models.User.find({
          where:{id: req.user.id}
        }).then(function(user){
          user.updateAttributes({password: bCrypt.hashSync(newpassword, bCrypt.genSaltSync(10), null)});
        }).then(function(){
          req.logout();
          res.redirect('/account');
        });
      }else{
        res.render('changepasswd',{ message: "wrong password",csrfToken: req.csrfToken()});
      }
    }else{
      res.render('changepasswd',{ message: "not match",csrfToken: req.csrfToken()});
    }
    
  });

  router.get('/retrieve', function(req, res){
    res.render('retrievepassword');
  });
  router.post('/retrieve', function(req, res){
    console.log('email: ', req.body.email);
    async.waterfall([
      function(done){
        crypto.randomBytes(20, function(error, buf){
          var token = buf.toString('hex');
          done(error, token);
        });
      },
      function(token, done){
        models.User.find({
          where:{email: req.body.email}
        }).then(function(user){
          if(user){
            user.updateAttributes({
              resetpasswordtoken: token
            }).then(function(err){
              console.log('db updated');
              console.log('sending email');
              EM.dispatchResetPasswordLink(user, function(err, m){
                console.log('m',m);
                if(!err){
                  console.log('no error');
                  res.render('checkemail');
                }else{
                  res.send('email server error');
                }
              });
            });
          }else{
            res.render('retrievepassword',{message: 'email not found'});
          }
        });
      }
    ],function(err){
      //error handling
      console.log('err',err);
    });
  });

  router.get('/resetpassword', function(req, res){
    var email = req.query.e;
    var token = req.query.token;
    console.log('email and token', email, token);
    models.User.find({
      where:{email: req.query.e}
    }).then(function(user){
      console.log('user',user);
      if(!user){
        res.send('not found');
      }
      else{
        if(user.resetpasswordtoken === token){
          console.log('*********varified*********');
          req.session.reset = {email:user.email};
          res.render('resetpassword');
        }
        else{
          res.send('verification error');
        }
      }
    });
  });
  router.post('/resetpassword', function(req, res){
    var newpassword = req.body.newpassword;
    var newpasswordagain = req.body.newpasswordagain;
    if (newpassword === newpasswordagain){
      //do
      console.log('session',req.session);
        models.User.find({
          where:{email: req.session.reset.email}
        }).then(function(user){
          user.updateAttributes({password: bCrypt.hashSync(newpassword, bCrypt.genSaltSync(10), null), resetpasswordtoken:bCrypt.hashSync(newpassword, bCrypt.genSaltSync(10), null)});
        }).then(function(){
          console.log('reset successful');
          req.logout();
          res.redirect('/account');
        });
    }else{
      res.render('resetpassword',{ message: "not match"});
    }

  });

  router.get('/*', function(req, res){
    res.redirect('/account');
  });

  return router;
};



function isLoggedIn(req, res, next) {

  if (req.isAuthenticated())
    return next();
  res.redirect('/account/login');
}


