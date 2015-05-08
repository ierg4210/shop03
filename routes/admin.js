var models = require('../models');
var express = require('express');
var passport = require('passport');
var csrf = require('csurf');
var router = express.Router();

module.exports = function(passport){

//csrf
var csrfProtection = csrf({cookie: true});
//var parseForm = bodyparser.urlencoded({ extended: false })
//CSP
router.use(function(req, res, next){
    res.header("Content-Security-Policy", "default-src 'self';script-src 'self';object-src 'none';img-src 'self';media-src 'self';frame-src 'none';font-src 'self' data:;connect-src 'self';style-src 'self'");
    next();
    //var schema = req.headers['x-forward-proto'];
    //if(schema == 'https'){
    //    next();
    //}
    //else{
    //    res.redirect('https://'+req.headers.host+req.url+'admin');
    //}

});

router.get('/', isLoggedIn, csrfProtection, function(req, res){
  console.log(req.user.email);
	models.Category.findAll({
		include: [ models.Product ]
	}).then(function(categories) {
		res.render('admin',{
			categories: categories,
      user: req.user,
      csrfToken: req.csrfToken()
		});
	});
});

//categories
//handle create new category form
router.post('/categories/create', isLoggedIn, csrfProtection, function(req, res) {
  if (req.param('categoryName')){
    models.Category.create({
      categoryName: req.param('categoryName')
    }).then(function() {
      res.redirect('/admin');
    });
  }
});

//create new product
router.post('/categories/createproduct', isLoggedIn, csrfProtection, function(req, res){
  //if (req.body.productCategory && req.body.productName && req.body.productPrice && req.body.productDesc && req.files.thumbnail.name){
  models.Category.find({
    where: { categoryName: req.body.productCategory }
  }).then(function(category){
    models.Product.create({
      productName: req.body.productName,
      productPrice: req.body.productPrice,
      productDesc: req.body.productDesc,
      productImage: req.files.thumbnail.name
  }).then(function(product){
      product.setCategory(category).then(function() {
        res.redirect('/admin');
      });
    });
  });
  //}
});

//edit category
router.route('/categories/:category_id/edit').get(isLoggedIn, csrfProtection, function(req, res){
  models.Category.find({
    where: {id: req.param('category_id')},
    include: [models.Product]
  }).then(function(category){
    //console.log("-------  "+category.categoryName);
    res.send('<form action="", method="post"/>'
            +'<input type="hidden" name="_csrf" value="'+ req.csrfToken()+'"></input>'
            +'<label>Name:</label>'
            +'<input type="text", name="categoryName" value=\"'+ category.categoryName +'\" >'
            +'<input type="submit"/>'
            +'</form>');
    });
  }).post(isLoggedIn, csrfProtection, function(req, res){
    models.Category.find({where: {id: req.param('category_id')}}).on('success', function(category){
      category.updateAttributes({
      categoryName: req.body.categoryName
    }).success(function(){res.redirect('/admin');});
  });
});


//delete category
router.get('/categories/:category_id/destroy', isLoggedIn, function(req, res) {
  models.Category.find({
    where: {id: req.param('category_id')},
    include: [models.Product]
  }).then(function(category) {
    models.Product.destroy(
      {where: {CategoryId: category.id}}
    ).then(function(affectedRows) {
      category.destroy().then(function() {
        res.redirect('/admin');
      });
    });
  });
});

//edit product
router.route('/categories/:category_id/products/:product_id/edit').get(isLoggedIn, csrfProtection, function(req, res){
  models.Category.find({
    where: {id: req.param('category_id')}
  }).then(function(category){
    models.Product.find({
      where: {id: req.param('product_id')}
    }).then(function(product){
      models.Category.findAll({include: [ models.Product ]}).then(function(categories){
        var optionText = "";
        for(var i=0;i<categories.length;i++){
          //console.log("+++"+categories[i].categoryName);
          optionText += '<option value="'
                            +categories[i].categoryName
                            +'">'
                            +categories[i].categoryName
                            +'</option>';
        }

        res.send('<form action="", enctype="multipart/form-data", method="post"/>'
                +'<input type="hidden" name="_csrf" value="'+ req.csrfToken()+'"></input>'
                +'<label>Name:</label>'
                +'<input type="text", name="productName" required="required" value='+ product.productName +' /><br>'
                +'<label>Price:</label>'
                +'<input type="text", name="productPrice" required="required" value='+ product.productPrice +' /><br>'
                +'<label>Description:</label><br>'
                +'<textarea rows="4", cols="50", name="productDesc" required="required" >'+ product.productDesc +'</textarea><br>'
                +'<label>Image:</label>'
                +'<input type="file", name="thumbnail" />'
                +'<select name="productCategory">'
                +optionText
                +'</select>'
                +'<input type="submit"/>'
                +'</form>');
      });
    });
  });
}).post(isLoggedIn, csrfProtection, function(req, res){
  models.Category.find({
    where: { id: req.param('category_id') }
  }).then(function(category) {
    models.Product.find({
      where: { id: req.param('product_id') }
    }).then(function(product) {
    
        if (req.files.thumbnail){
          product.updateAttributes({productImage: req.files.thumbnail.name});
          //console.log('update image: '+req.files.thumbnail.name);
        }
        product.updateAttributes({
          productName: req.body.productName,
          productPrice: req.body.productPrice,
          productDesc: req.body.productDesc
        }).then(function(category2){
          models.Category.find({
          where: {categoryName: req.body.productCategory}
        }).then(function(category2){
          product.setCategory(category2);
        }).success(function() {
          res.redirect('/admin');
        });
      });
    });
  });
});

//delete product
router.get('/categories/:category_id/products/:product_id/destroy', isLoggedIn, function (req, res) {
  models.Category.find({
    where: { id: req.param('category_id') }
  }).then(function(category) {
    models.Product.find({
      where: { id: req.param('product_id') }
    }).then(function(product) {
      product.setCategory(null).then(function() {
        product.destroy().then(function() {
          res.redirect('/admin');
        });
      });
    });
  });
});

router.get('/login',csrfProtection, function(req, res){
  //console.log("login");
	res.render('login',{ message: req.flash('loginMessage'), csrfToken: req.csrfToken()});
});

router.post('/login', csrfProtection, passport.authenticate('login', {
	successRedirect : '/admin',
	failureRedirect : 'login',
	failureFlash : true
}));

//router.get('/signup',function(req, res){
//	res.render('signup',{ message: req.flash('signupMessage')});
//});

//router.post('/signup', passport.authenticate('signup', {
//	successRedirect : '/admin',
//	failureRedirect : 'signup',
//	failureFlash : true
//}));

//
router.get('/logout', function(req,res){
  req.logout();
  res.redirect('/admin');
});

// 
router.get('/*', function(req, res){
  res.redirect('/admin');
});

return router;
}

function isLoggedIn(req, res, next) {

	if (req.isAuthenticated()){
    if(req.user.email == "")
		  return next();
  }
  var httpsUrl = "https://"+req.get('host') + '/admin/login';
  //console.log('httpsURL = ',httpsUrl);
	res.redirect(httpsUrl);

}


