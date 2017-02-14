// Routing
Router.configure({
	layoutTemplate: 'ApplicationLayout',
	websiteRighPanelTemplate: 'WebsiteRightPanelTemplate'
});

Router.route('/', {
	layoutTemplate: 'ApplicationLayout',
	action: function () {
		this.render('navbar', {
			to:"navbar"
		});
		this.render('mainContent', {
			to:"main"
		});
		this.render('site_add_confirm', {
			to:"site_add_confirm"
		});
		this.render('recommended_sites', {
			to:"RightPanelTemplate",
		});
	},
});

Router.route('/website/:_id', function () {
	this.render('navbar', {
		to:"navbar"
	});
	this.render('website', {
		to:"main",
		data: function() {
			return Websites.findOne({_id:this.params._id});
		}
	});
	this.render('site_add_confirm', {
		to:"site_add_confirm"
	});
});

/// accounts config

Accounts.ui.config({
  passwordSignupFields: "USERNAME_AND_EMAIL"
});


Template.site_add_confirm.onCreated(function site_add_confirmOnCreated() {
	var that = this;
	this.message = new ReactiveVar({});
});

Template.comments_form.onCreated(function commemtsFormOnCreated() { 
	var that = this;
	that.pristineEditingComment = {
		rating: 5,
		postedAt: new Date()
	};
	this.editingComment = new ReactiveVar($.extend({}, that.pristineEditingComment));
});

var filterObj = function(filterVal) {
	return {'$regex': filterVal, $options:'i'};			
};

/////
// template helpers 
/////

// helper function that returns all the recommended sites
Template.recommended_sites.helpers({
	recommendSites:function(){
		// First we recover the sites that have been voted up
		var votedUpSitesCursor = Websites.find({upvotes: { $gt: 0}}, {sort:{upvotes: -1}});
		var recommendedSites = [];
		var pieces = [];
		votedUpSitesCursor.forEach(function(site) {
			if (site.title) {
				var titlePieces = site.title.split(' ');
				if (titlePieces && titlePieces.length > 0) {
					pieces = _.union(pieces, titlePieces);
				}
			}
		});			
		if (!_.isEmpty(pieces)) {
			// For each piece We look for sites in the db
			$.each(pieces, function(index, piece) {
				if (piece && piece.match(/^[0-9a-zA-Z]+$/)) {
					var sitesByPieceCursor = Websites.find({$or: [{title:filterObj(piece)}, {description:filterObj(piece)}]});
					sitesByPieceCursor.forEach(function(site) {
						if (!_.find(recommendedSites, function (recommendedSite) {return recommendedSite.url === site.url;})) {
							recommendedSites.push(site);
						}
					});
				}
			});	
		}
		return recommendedSites;
	}
});

// helper function that returns all available websites
Template.website_list.helpers({
	websites:function(){
		var filterVal = Session.get("siteFilter");		
		if (filterVal) {
			return Websites.find({$or: [{title:filterObj(filterVal)}, {description:filterObj(filterVal)}, {url:filterObj(filterVal)}]});
		} else {
			return Websites.find({}, {sort:{upvotes: -1}});
		}
	}
});

var websiteCommonHelpers = {
	getFormattedDate:function(date){
		return moment(date).format('MMMM Do YYYY, h:mm:ss a');
	}
};

Template.website_item.helpers(websiteCommonHelpers);

var websiteHelper = $.extend({}, websiteCommonHelpers, {
	getPostedBy:function(){
		var postedByUser = Meteor.users.findOne({_id: this.postedBy});
		return postedByUser ? postedByUser.username : '';
	}
});

Template.website.helpers(websiteHelper);

Template.site_add_confirm.helpers({	
	message() {
    	return Template.instance().message.get();
  	}
});

Template.comments_form.helpers($.extend({}, websiteCommonHelpers, {
	editingComment:function(){
		return Template.instance().editingComment.get();
	}
}));

/////
// template events 
/////

Template.website_search.events({
	'keyup .js-set-site-filter'(event, instance) {		
		Session.set("siteFilter", event.target.value);
	}
});

Template.site_add_confirm.events({
  'change #site_add_confirm'(event, instance, data) {
  	instance.message.set(data);
  }
});

var websiteCommonEvents = {
	"click .js-upvote":function(event){
		// example of how you can access the id for the website in the database
		// (this is the data context for the template)
		var website_id = this._id;
		console.log("Up voting website with id "+website_id);
		// put the code in here to add a vote to a website!
		var website = Websites.findOne({_id: website_id});
		var upvotes = (website.upvotes ? website.upvotes + 1 : 1);
		Websites.update({_id: website_id}, {$set: {"upvotes": upvotes}});	

		return false;// prevent the button from reloading the page
	}, 
	"click .js-downvote":function(event){

		// example of how you can access the id for the website in the database
		// (this is the data context for the template)
		var website_id = this._id;
		console.log("Down voting website with id "+website_id);
		// put the code in here to remove a vote from a website!
		var website = Websites.findOne({_id: website_id});
		var downvotes = (website.downvotes ? website.downvotes + 1 : 1);
		Websites.update({_id: website_id}, {$set: {"downvotes": downvotes}});		

		return false;// prevent the button from reloading the page
	}
}

Template.website_item.events(websiteCommonEvents);

Template.website.events(websiteCommonEvents);

var refresh_editingComment = function(event, instance) {
	var editingComment = instance.editingComment.get();
	editingComment[$(event.currentTarget).attr('name')] = $(event.currentTarget).val();
	editingComment['postedAt'] = new Date();
	instance.editingComment.set(editingComment);
};

Template.comments_form.events({
	"submit .js-save-comment-form":function(event, instance) {
		if (Meteor.user()) {
			// We add the comment to the website
			var website = Websites.findOne({_id:this._id});
			var comments = website.comments;
			var comment = {
				rating: event.target.rating.value,
				comment: event.target.comments.value,
				postedBy: Meteor.user()._id,
				postedAt: new Date()
			}			
			if (comments && comments.length > 0) {
				website.comments.push(comment);
			} else {
				website.comments = [comment];
			}
			Websites.update({_id: website._id}, {$set: {"comments": website.comments}});			
			instance.editingComment.set($.extend({}, instance.pristineEditingComment, {postedAt: new Date()}));
			$('.js-save-comment-form')[0].reset();
			$('#site_add_confirm').trigger('change', {title:'Site Confirmation', message:'The comment about this Web Site has been added!'});
	    	$('#site_add_confirm').modal('show');
		} else {
			$('#site_add_confirm').trigger('change', {title:'Site Confirmation', message:'The users need to be logged in first to add a comment on a Web Site!'});
	    	$('#site_add_confirm').modal('show');
		}
		return false; // stop the form submit from reloading the page
	},
	"keyup .js-refresh-editingComment :input:not(':button')": refresh_editingComment,
	"click .js-refresh-editingComment :input:not(':button')": refresh_editingComment
});

Template.website_form.events({
	"click .js-toggle-website-form":function(event){
		$("#website_form").toggle('slow');
	}, 
	"submit .js-save-website-form":function(event){

		// here is an example of how to get the url out of the form:
		var url = event.target.url.value;
		console.log("The url they entered is: "+url);
		if (Meteor.user()){
			//  put your website saving code in here!
			Meteor.call("getWebsiteData", url, function(err, data) {				
				var $content = $('<div>');
            	$content.append($.parseHTML(data.content));
				Websites.insert({
		    		title:$('title', $content).text(),
		    		url:url,
		    		description:$('meta[name="description"]', $content).attr('content'),
		    		createdOn:new Date(),
		    		createdBy:Meteor.user()._id
		    	});
		    	//Template.site_add_confirm.helpers({title:'Site Confirmation', message:'The site has been added!'});
		    	$('#site_add_confirm').trigger('change', {title:'Site Confirmation', message:'The site has been added!'});
		    	$('#site_add_confirm').modal('show');
	    		$('.js-save-website-form')[0].reset();
			});
		} else {
			//Template.site_add_confirm.helpers({title:'Site Confirmation', message:'The users needs to logged in first to add a Web Site!'});
			$('#site_add_confirm').trigger('change', {title:'Site Confirmation', message:'The users needs to be logged in first to add a Web Site!'});
	    	$('#site_add_confirm').modal('show');
		}

		return false;// stop the form submit from reloading the page

	}
});