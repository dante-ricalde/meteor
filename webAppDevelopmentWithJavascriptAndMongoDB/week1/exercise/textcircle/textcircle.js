this.Documents = new Mongo.Collection("documents");
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
				editor.on("change", function(cm_editor, info){
					console.log(cm_editor.getValue());
					$("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
				});
			}
		}
	});
}

if (Meteor.isServer) {
	Meteor.startup(function () {
		// code to run on server at startup
		if (!Documents.findOne()) { // no documents yet!
			Documents.insert({title: "my new document"});
		}

	});
}