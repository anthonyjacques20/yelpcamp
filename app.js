var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
//Configure dotenv so we can use usernames/passwords
require('dotenv').config();
//SCHEMA SETUP
var Campground = require("./models/campground");
var Comment = require("./models/comment");
var User = require("./models/user");
var seedDB = require("./seeds");

//Require routes
var campgroundRoutes = require("./routes/campgrounds");
var commentRoutes = require("./routes/comments");
var indexRoutes = require("./routes/index");

//Connect to database
//mongoose.connect("mongodb://localhost:27017/yelp_camp", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose.connect("mongodb+srv://mongoDBUser:" + process.env.DB_PASS + "@anthonyscluster-secvg.mongodb.net/test?retryWrites=true&w=majority", 
	{
		useNewUrlParser: true,
		useCreateIndex: true,
		useUnifiedTopology: true
}).then(() => {
	console.log("Connected to DB!");
}).catch(err => {
	console.log("Error: " + err.message);
});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
//__dirname shows in what directory this was run
//Serve the public directory
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());		//Tell the app to use connect-flash


//seedDB();	//Seed the database

//==========================
//PASSPORT CONFIGURATION
//==========================
app.use(require("express-session")({
	secret: "Secrets are dope and are the key",
	resave: false,
	saveUninitialize: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));	//User.authenticate comes from passportLocalMongoose
passport.serializeUser(User.serializeUser());	//User.serialize comes from passportLocalMongoose
passport.deserializeUser(User.deserializeUser());	//User.deserialize comes from passportLocalMongoose

//Create our own middleware that gets called on every route and passes the req.user to every template
app.use(function(req, res, next){
	//Pass the user
	res.locals.currentUser = req.user;
	//Pass the flash error message
	res.locals.error = req.flash("error");
	//Pass the flash success message
	res.locals.success = req.flash("success");
	next();
});

app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes);	//Append `/campgrounds` in front of every route
app.use("/campgrounds/:id/comments", commentRoutes);


var port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
	console.log("The YelpCamp app has started!");
})