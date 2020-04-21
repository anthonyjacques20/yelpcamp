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
//Image upload code
var multer = require("multer");
var storage = multer.diskStorage({
	//Create a custom name for the uploaded file
	filename: function(req, file, callback) {
		callback(null, Date.now() + file.originalname);
	}
});
//Only allow certain file types
var imageFilter = function (req, file, cb) {
	// accept image file sonly
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
		return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true)
};
var upload = multer({storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({
	cloud_name: 'anthonyjacques20',
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});
//=======================

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
			res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds'});
		}
	})
});

//CREATE - Add a new one to the DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
	//Put this code in the callback for geocoder.geocode() callback for google maps
	cloudinary.v2.uploader.upload(req.file.path, function(err, result){
		if(err){
			req.flash("error", err.message);
			return res.redirect("back");
		}
		
		//Add cloudinary url for the image to the campground object under image property
		req.body.campground.image = result.secure_url;
		//add image's public_id to campground object
		req.body.campground.imageId = result.public_id;
		//Add author to campground
		req.body.campground.author = {
			id: req.user._id,
			username: req.user.username
		}
		Campground.create(req.body.campground, function(err, campground){
			if(err){
				req.flash('error', err.message);
				return res.redirect('back');
			}
			res.redirect('/campgrounds/' + campground.id);
		});
	});
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
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res){
	
	Campground.findById(req.params.id, async function(err, campground){
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		}
		else{
			//Check to see if a file was uploaded
			if(req.file) {
				try{
					//Delete the old image so that we don't get a bunch of random images
					await cloudinary.v2.uploader.destroy(campground.imageId);
					var result = await cloudinary.v2.uploader.upload(req.file.path);
					//Update the name and description
					campground.imageId = result.public_id;
					campground.image = result.secure_url;
				} catch(err) {
					req.flash("error", err.message);
					return res.redirect("back");
				}

			}
			//Update the name and description
			campground.name = req.body.campground.name;
			campground.description = req.body.campground.description;
			campground.price = req.body.campground.price;
			campground.save();
			
			req.flash("success", "Successfully Updated!");
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
	Campground.findById(req.params.id, async function(err, campground){
		if(err){
			req.flash("error", err.message)
			return res.redirect("back");
		}
		try {
			await cloudinary.v2.uploader.destroy(campground.imageId);
			campground.remove();
			req.flash("success", "Campground deleted successfully");
			res.redirect("/campgrounds");
		} catch(err) {
			req.flash("error", err.message)
			return res.redirect("back");
		}
	})
});


module.exports = router;