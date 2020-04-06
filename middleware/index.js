var Campground = require("../models/campground");
var Comment = require("../models/comment");

//All of the middleware goes here
var middlewareObj = {};

//Check the owner of the campground
middlewareObj.checkCampgroundOwnership = function(req, res, next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, function(err, foundCampground){
			if(err || !foundCampground){
				req.flash("error", "Campground not found");
				res.redirect("back");
			}
			else{
				//Does user own the campgrounds?
				if(foundCampground.author.id.equals(req.user._id)){
					next();
				}
				else{
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	}
	else{
		req.flash("error", "You need to be logged in to do that");
		//Send a user back to the previous page
		res.redirect("back");
	}
}

//Check the owner of the comment
middlewareObj.checkCommentOwnership = function(req, res, next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err || foundComment){
				console.log(err);
				req.flash("error", "Comment not found");
				res.redirect("back");
			}
			else{
				//Does user own the comment?
				if(foundComment.author.id.equals(req.user._id)){
					next();
				}
				else{
					req.flash("error", "You don't have permission to change this comment");
					res.redirect("back");
				}
			}
		});
	}
	else{
		req.flash("error", "You need to be logged in to do that");
		//Send a user back to the previous page
		res.redirect("back");
	}
}

middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	//If the user isn't logged in, then display the flash message
	req.flash("error", "Please Login!");
	res.redirect("/login");
}


module.exports = middlewareObj;