var mongoose = require("mongoose");
const Comment = require("./comment");

var campgroundSchema = new mongoose.Schema({
	name: String,
	image: String,
	description: String,
	price: String,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	]
});

//Pre hook to delete all comments whenever we delete a campground
campgroundSchema.pre('remove', async function(){
	await console.log("Tried removing all comments in remove pre hook");
	await Comment.remove({
		"_id": {
			$in: this.comments
		}
	});
});

var Campground = mongoose.model("Campground", campgroundSchema);

module.exports = Campground;