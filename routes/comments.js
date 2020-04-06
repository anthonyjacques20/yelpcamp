var express = require("express");
var router = express.Router({mergeParams: true});	//Need the mergeParams option set to true so that we can successfully reference the campground ID on the comment routes
//var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
//If we require a directory, then it automatically requires index.js as the main file in that directory
//This behavior is default since it assumes index.js is the main file
//This doesn't happen with any other file name
//So these two lines are the same
//var middleware = require("../middleware/index");
var middleware = require("../middleware");

//======================
//COMMENTS ROUTES!
//======================
//NEW - show new form
router.get("/new", middleware.isLoggedIn, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
		}
		else{
			res.render("comments/new", {campground: campground});
		}
	});
});

//CREATE - Create a new comments
router.post("/", middleware.isLoggedIn, function(req, res){
	var comment = req.body.comment;
	
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
		}
		else{
			//Need to creat the comment in the DB before we can link to it in our campground
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					req.flash("error", "Something went wrong creating a comment...");
					console.log(err);
				}
				else{
					//Add username and ID to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					//Save the comment
					comment.save();
					campground.comments.push(comment);
					campground.save(function(err){
						if(err){
							console.log(err);
							res.redirect("/campgrounds");
						}
						else{
							req.flash("success", "Successfully added comment");
							res.redirect("/campgrounds/" + campground._id);
						}
					});
				}
			});
		}
	});
});


//EDIT - edit comments
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err || !foundComment){
			res.redirect("back");
		}
		else{
			res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
		}
	})
});

//UPDATE - Update the comment
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, foundComment){
		if(err){
			res.redirect("back");
		}
		else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//DESTROY - Delete the comment
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			res.redirect("back");
		}
		else{
			req.flash("success", "Comment successfully deleted");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

module.exports = router;