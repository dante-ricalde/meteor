Websites = new Mongo.Collection("websites");

// set up security on Websites collection
Websites.allow({
	insert:function(userId, doc){
		console.log("testing security on website insert");
		if (Meteor.user()) {// they are logged in
			if (userId != doc.createdBy) { // the user is messing about
				return false;
			} else {// the user is logged in, the web site has the correct user id
				return true;
			}
		} else {// user not logged in
			return false;
		}
	},
	update: function(userId, doc){
		return true;
	},
	remove:function(userId, doc){
		return true;
	}
});