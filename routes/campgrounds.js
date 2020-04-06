var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
//If we require a directory, then it automatically requires index.js as the main file in that directory
//This behavior is default since it assumes index.js is the main file
//This doesn't happen with any other file name
//So these two lines are the same
//var middleware = require("../middleware/index");
var middleware = require("../middleware");

//=======================
//Campground Routes
//=======================
//INDEX
router.get("/", function(req, res){
	//Get all campgrounds
	Campground.find({}, function(err, allCampgrounds){
		if(err){
			console.log(err);
		}
		else{
			res.render("campgrounds/index", {campgrounds: allCampgrounds});
		}
	})
});

//CREATE - Add a new one to the DB
router.post("/", middleware.isLoggedIn, function(req, res){
	//Grab the name and image from the body
	var name = req.body.name;
	var image = req.body.image;
	var description = req.body.description;
	var price = req.body.price;
	//Pass author to new Campground
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	//Create a new object
	var newCampground = {name: name, image: image, description: description, author: author, price: price};
	//Save campground to DB
	Campground.create(newCampground, function(err, newlyCreatedCampground){
		if(err){
			console.log(err);
		}
		else{
			console.log(newlyCreatedCampground);
			res.redirect("/campgrounds");
		}
	})
});

//NEW - show new form
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("campgrounds/new");
});

//SHOW - shows more info about one campground
router.get("/:id", function(req, res){
	console.log(req.params.id);
	//Find the campground with the provided ID
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err || !foundCampground){
			console.log(err);
		}
		else{
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});

//EDIT - edit a campgrounds
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		res.render("campgrounds/edit", {campground: foundCampground});
	});
});

// UPDATE - PUT method to updating the campground
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
		if(err){
			res.redirect("/campgrounds");
		}
		else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//DESTROY - remove campground router
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
	//If we use findByIdAndRemove, then it doesn't trigger the remove pre hook
	//We need the remove pre hook to delete all comments associated with this campground
	/*Campground.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/campgrounds");
		}
		else{
			res.redirect("/campgrounds");
		}
	});
	*/
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
			res.redirect("/");
		}
		else{
			campground.remove();
			res.redirect("/campgrounds");
		}
	})
});


module.exports = router;