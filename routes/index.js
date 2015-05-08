var models  = require('../models');
var express = require('express');
//var dataEngine = require('../data')


var router  = express.Router();

//index page
router.get('/', function(req, res){
	models.Category.findAll({
		include: [ models.Product ]
	}).then(function(categories) {
    res.redirect('./1');
	});
});



//shoppingCart handler
router.get('/retrieve/:product_id', function(req, res){
  models.Product.find({
    where: {id: req.param('product_id')}
  }).then(function(product){
    res.send(product);
  });
});

//client
router.route('/:category_id').get(function(req, res){
  //if(req.param('category_id') == parseInt(req.param('category_id'),10)){
  models.Category.findAll({
    include: [ models.Product ]
  }).then(function(categories) {
    models.Category.find({
      where: {id: req.param('category_id')},
      include: [models.Product]
    }).then(function(category){
      res.render('index',{
        categories: categories,
        category: category,
        user: req.user
      });
    });
  });
  //}
  //else{
  //  res.render('error', {
  //      message: "404",
  //      error: {}
  //  });
  //}
});

//product page handler
router.route('/:category_id/:product_id').get(function(req, res){
  //if((req.param('category_id') == parseInt(req.param('category_id'),10))&&(req.param('product_id') == parseInt(req.param('product_id'),10))){
  models.Category.findAll({
    include: [ models.Product ]
  }).then(function(categories) {
    models.Category.find({
    where: {id: req.param('category_id')}
  }).then(function(category){
    models.Product.find({
      where: {id: req.param('product_id')}
  }).then(function(product){
      res.render('product',{
        categories: categories,
        category: category,
        product: product,
        user: req.user
        });
      });
    });
  });
  //}
  //else{
  //  res.render('error', {
  //  message: "404",
  //  error: {}
  //});
  //}
});


module.exports = router;




