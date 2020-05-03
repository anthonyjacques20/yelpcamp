var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var middleware = require("../middleware");


//Root route
router.get("/", function(req, res){
	res.render("landing");
})


//==================
//AUTH ROUTES
//==================
//Show register form
router.get("/register", function(req, res){
	res.render("register", {page: 'register'});
});
//Handle sign up logic
router.post("/register", function(req, res){
	var newUser = new User({username: req.body.username});
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			//If there is an error, log it and then show them the register page again
			console.log(err);
			//Display the error as a flash
			req.flash("error", err.name + ": " + err.message);
			return res.redirect("/register");
		}
		//Authenticate the user
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome to YelpCamp " + user.username);
			res.redirect("/campgrounds");
		});
	});
});

//Show login form
router.get("/login", function(req, res){
	res.render("login", {page: 'login'});
});

//Handle login logic
//Add passport.authenticate middleware to handle the actual login
router.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/campgrounds",
		failureRedirect: "/login",
		failureFlash: true
	}), function(req, res){
});

//Logout logic route
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Successfully Logged Out!");
	res.redirect("/campgrounds");
});

router.get("/about", function(req, res){
	res.render("about", {page: 'about'});
});

module.exports = router;