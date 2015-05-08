var LocalStrategy   = require('passport-local').Strategy;
var models = require('../models');
var bCrypt = require('bcrypt-nodejs');

module.exports = function(passport){

	passport.use('signup', new LocalStrategy({
			usernameField : 'email',
			passwordField : 'password',
			passReqToCallback : true // allows us to pass back the entire request to the callback
		},
		function(req, email, password, done) {

			var findOrCreateUser = function(){
				models.User.find({where:{ 'email' :  email }})
					.then(function(user) {
					// In case of any error, return using the done method
					//if (err){
						//console.log('Error in SignUp: '+err);

					//	return done(err);
					//}
					// already exists
					if (user) {
						console.log('User already exists with username: '+email);
						return done(null, false, req.flash('signupMessage','Email is taken.'));
					} else {
						// if there is no user with that email
						// create the user
						console.log("############"+req.body.admin);
						var admin;
						if(req.body.admin){
							admin = 1;
						}
						else{
							admin = 0;
						}
						//check email format validity
						var email_re = /^[\w=+\-\/][\w=\'+\-\/\.]*@[\w\-]+(\.[\w\-]+)*(\.[\w]{2,6})$/;
						if(!email_re.test(email)){
							return done(null, false, req.flash('signupMessage','Email Invalid.'));
						}
						models.User.create({
							email: email,
							password: createHash(password),
							admin: admin
						}).then(function(user){
							console.log('User Registration succesful');
							return done(null, user);
						});
						}

						});
					}

			// Delay the execution of findOrCreateUser and execute the method
			// in the next tick of the event loop
			process.nextTick(findOrCreateUser);
		})
	);

	// Generates hash using bCrypt
	var createHash = function(password){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	}

}