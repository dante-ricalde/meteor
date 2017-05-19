/*
var myVar = 10;

// These methods are for both client and server
Meteor.methods({
	getDate: function(date) {
		return moment(date).format('MMMM Do YYYY, h:mm:ss a');
	}
});
*/
Meteor.methods({
	addComment: function (comment) {
		console.log('addComment method running!');
		if (this.userId) {// we have a user
			//comment.createdOn = new Date();
			//comment.owner = this.userId;
			console.log('Inserting the comment');
			console.log(comment);
			return Comments.insert(comment);
		}
		return;
	},
	addDoc: function() {
		var doc;
		if (!this.userId) { // not logged in
			return;
		} else {
			doc = {owner:this.userId, createdOn:new Date(), title:"my new doc"};
			var id = Documents.insert(doc);
			console.log('addDoc method: got an id ' + id);
			return id;
		}
	},
	updateDocPrivacy: function(doc) {
		console.log("updateDocPrivacy method");
		console.log(doc);
		var realDoc = Documents.findOne({_id:doc._id, owner:this.userId});
		if (realDoc) {
			realDoc.isPrivate = doc.isPrivate;
			Documents.update({_id:doc._id}, realDoc);
		}
	},
	addEditingUser: function(docid) {
		var doc, user, eusers;
		doc = Documents.findOne({_id:docid});
		if (!doc) { return; } // no doc give up
		if (!this.userId) { return; } // no logged in user give up
		// now I have a doc and possibly a user
		user = Meteor.user().profile;
		eusers = EditingUsers.findOne({docid: doc._id});
		if (!eusers) {
			eusers = {
				docid: doc._id,
				users: {}
			}
		}
		user.lastEdit = new Date();
		console.log('User: ' + user['first-name'] + ' has edited the document at ' + user.lastEdit);
		eusers.users[this.userId] = user;

		EditingUsers.upsert({_id: eusers._id}, eusers);
	}
});