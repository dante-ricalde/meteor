this.Documents = new Mongo.Collection("documents");
EditingUsers = new Mongo.Collection("editingUsers");
/*
var myVar = 10;

// These methods are for both client and server
Meteor.methods({
	getDate: function(date) {
		return moment(date).format('MMMM Do YYYY, h:mm:ss a');
	}
});
*/
if (Meteor.isClient) {
	/*
	// update the session current_date
	// variable every 1000 ms
	Meteor.setInterval(function(){
		Session.set("current_date", new Date());
	}, 1000);

	Template.date_display.helpers({
		"current_date": function () {
			return Session.get("current_date");
		},
		myVar: function () {
			return myVar;
		}
	});

	Template.date_display_dante.onCreated(function date_display_danteOnCreated() {
		var that = this;
		that.current_date_dante = new ReactiveVar(new Date());
		Meteor.setInterval(function() {
			that.current_date_dante.set(new Date());
		}, 1000);
	});

	Template.date_display_dante.helpers({
		"current_date_dante": function () {
			return Meteor.apply("getDate", [Template.instance().current_date_dante.get()], {returnStubValue: true});
		}
	});*/

	Template.editor.helpers({
		docid:function(){
			var doc = Documents.findOne();
			if (doc) {
				return doc._id;
			} else {
				return undefined;
			}	
		},
		config:function(){
			return function (editor) {
				editor.setOption("lineNumbers", true);
				editor.setOption("mode", "html");
				editor.setOption("theme", "cobalt");
				editor.on("change", function(cm_editor, info){
					//console.log(cm_editor.getValue());
					$("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
					Meteor.call("addEditingUser");
				});
			}
		}
	});

	Template.editingUsers.helpers({
		users: function() {
			var doc, eusers, users;
			doc = Documents.findOne();
			if (!doc){ return; } // give up
			eusers = EditingUsers.findOne({docid:doc._id});
			if (!eusers) { return; } // give up
			users = [];
			for (var user_id in eusers.users) {
				console.log('adding a user');
				console.log(eusers.users[user_id]);
				users.push(eusers.users[user_id]);
				//users.push(fixObjectKeys(eusers.users[user_id]));
			}
			return users;
		}
	});

	///////////////
	//// EVENTS
	//////////////
	Template.navbar.events({
		"click .js-add-doc": function(event){
			event.preventDefault();
			console.log("Add a new doc!");
		}
	});

}// end isClient

if (Meteor.isServer) {
	Meteor.startup(function () {
		// code to run on server at startup
		if (!Documents.findOne()) { // no documents yet!
			Documents.insert({title: "my new document"});
		}

	});
}

Meteor.methods({
	addEditingUser: function() {
		var doc, user, eusers;
		doc = Documents.findOne();
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

function fixObjectKeys(obj) {
	var newObj = {};
	for (key in obj) {
		var key2 = key.replace("-", "");
		newObj[key2] = obj[key];
	}
	return newObj;
}