var LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var models = require('../models');
var bCrypt = require('bcrypt-nodejs');

module.exports = function(passport){
	passport.use('login', new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, email, password, done) { 
            models.User.find({ where: {'email' :  email }
            }).then(function(user) {
                    // Username does not exist, log the error and redirect back
                    if (!user){                    
                        return done(null, false, req.flash('loginMessage', 'cant login'));                 
                    }
                    // User exists but wrong password, log the error 
                    if (!isValidPassword(user, password)){                
                        return done(null, false, req.flash('loginMessage', 'cant login')); // redirect back to login page
                    }
                    // User and password both match, return user from done method
                    // which will be treated like success
                    return done(null, user);
            });
        }
    ));


    var isValidPassword = function(user, password){
        return bCrypt.compareSync(password, user.password);
    };

    passport.use(new FacebookStrategy({
        clientID: '',
        clientSecret: '',
        callbackURL: ''
    },
    function(accessToken, refreshToken, profile, done){
        models.User.find({
            where:{'email':profile.emails[0].value}
        }).then(function(user){
            if(user){
                return done(null, user);
            }else{
                console.log('fb ',profile);
                models.User.create({
                    email: profile.emails[0].value,
                    //fbtoken: accessToken,
                    //fbid: profile.id,
                    //fbname: profile.name.givenName +' '+ profile.name.firstName 
                    password: bCrypt.hashSync(accessToken, bCrypt.genSaltSync(10), null)
                }).then(function(user){
                    return done(null, user);
                });
            }
        });
    }
    ));




    
};