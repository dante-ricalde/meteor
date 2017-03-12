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
		/*docid:function(){
			var doc = Documents.findOne();
			if (doc) {
				return doc._id;
			} else {
				return undefined;
			}	
		},*/
		docid: function(){
			setupCurrentDocument();
			return Session.get("docid");
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

	Template.navbar.helpers({
		documents: function() {
			return Documents.find({});
		}
	});

	Template.docMeta.helpers({
		document: function() {
			return Documents.findOne({_id:Session.get("docid")});
		}
	});

	Template.editableText.helpers({
		userCanEdit: function(doc, Collection) {
			// can edit if the current doc is owned by me.
			doc = Documents.findOne({_id:Session.get("docid"), owner:Meteor.userId()});
			if (doc) {
				return true;
			} else {
				return false;
			}
		}
	});

	///////////////
	//// EVENTS
	//////////////
	Template.navbar.events({
		"click .js-add-doc": function(event){
			event.preventDefault();
			console.log("Add a new doc!");
			if (!Meteor.user()) { // user not available
				alert("You need to login first!");
			} else {
				// They are logged in ...lets insert a doc
				var id = Meteor.call('addDoc', function (err, res) {
					if (!err) { // all good
						console.log('event callback received id: ' + res);
						Session.set("docid", res);
					}
				});
			}
		},
		"click .js-load-doc": function(event){
			console.log(this);
			Session.set("docid", this._id);
		}
	});

	Template.docMeta.events({
		"click .js-tog-private": function(event) {
			console.log(event.target.checked);
			var doc = {_id:Session.get("docid"), isPrivate:event.target.checked};
			Meteor.call("updateDocPrivacy", doc);
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

function setupCurrentDocument() {
	var doc;
	if (!Session.get("docid")){// no doc id set yet
		console.log('Setting the docid in the session.');
		doc = Documents.findOne();
		if (doc) {
			Session.set("docid", doc._id);
		}
	} else {
		console.log('Using the docid from Session');
	}
}

function fixObjectKeys(obj) {
	var newObj = {};
	for (key in obj) {
		var key2 = key.replace("-", "");
		newObj[key2] = obj[key];
	}
	return newObj;
}