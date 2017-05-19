Meteor.startup(function () {
	// code to run on server at startup
	if (!Documents.findOne()) { // no documents yet!
		Documents.insert({title: "my new document"});
	}
});

// I am only allowed to see whatever documents come back from this publish function
Meteor.publish("documents", function(){
	return Documents.find({
		$or: [
			{isPrivate:{$ne:true}},
			{owner:this.userId}
		]
	});
});

Meteor.publish("editingUsers", function(){
	return EditingUsers.find();
});

Meteor.publish("comments", function () {
	return Comments.find();
});