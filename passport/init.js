var login = require('./login');
var signup = require('./signup');
var models = require('../models');

module.exports = function(passport){

	// Passport needs to be able to serialize and deserialize users to support persistent login sessions
    passport.serializeUser(function(user, done) {
        //console.log('serializing user: ');
        //console.log(user);
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        models.User.find(id).then(function(user) {
            //console.log('deserializing user:',user);
            done(null, user);
        });
    });

    // Setting up Passport Strategies for Login and SignUp/Registration
    login(passport);
    signup(passport);

}