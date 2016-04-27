import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {EventManager} from '/lib/eventmanager.js';
import {Hashtags} from '/lib/hashtags.js';

Meteor.methods({
	'EventManager.setSessionStatus': (privateKey, hashtag, sessionStatus)=> {
		if (Meteor.isClient) {
			return;
		}

		new SimpleSchema({
			privateKey: {type: String},
			hashtag: {type: String},
			sessionStatus: {type: Number}
		}).validate({
			privateKey,
			hashtag,
			sessionStatus
		});

		if (!Hashtags.findOne({
				hashtag: hashtag,
				privateKey: privateKey
			})) {
			throw new Meteor.Error('EventManager.setSessionStatus', 'plugins.splashscreen.error.error_messages.not_authorized');
		}

		return EventManager.update({hashtag: hashtag}, {$set: {sessionStatus: sessionStatus}});
	},
	'EventManager.showReadConfirmedForIndex': (privateKey, hashtag, index)=> {
		if (Meteor.isClient) {
			return;
		}

		new SimpleSchema({
			privateKey: {type: String},
			hashtag: {type: String},
			index: {type: Number}
		}).validate({
			privateKey,
			hashtag,
			index
		});

		if (!Hashtags.findOne({
				hashtag: hashtag,
				privateKey: privateKey
			})) {
			throw new Meteor.Error('EventManager.showReadConfirmedForIndex', 'plugins.splashscreen.error.error_messages.not_authorized');
		}

		return EventManager.update({hashtag: hashtag}, {$set: {readingConfirmationIndex: index}});
	},
	'EventManager.setActiveQuestion': (privateKey, hashtag, index)=> {
		if (Meteor.isClient) {
			return;
		}

		new SimpleSchema({
			privateKey: {type: String},
			hashtag: {type: String},
			index: {type: Number}
		}).validate({
			privateKey,
			hashtag,
			index
		});

		if (!Hashtags.findOne({
				hashtag: hashtag,
				privateKey: privateKey
			})) {
			throw new Meteor.Error('EventManager.setActiveQuestion', 'plugins.splashscreen.error.error_messages.not_authorized');
		}

		return EventManager.update({hashtag: hashtag}, {$set: {questionIndex: index, readingConfirmationIndex: index}});
	},
	'EventManager.clear': (privateKey, hashtag) => {
		if (Meteor.isClient) {
			return;
		}

		new SimpleSchema({
			privateKey: {type: String},
			hashtag: {type: String}
		}).validate({
			privateKey,
			hashtag
		});

		if (!Hashtags.findOne({
				hashtag: hashtag,
				privateKey: privateKey
			})) {
			throw new Meteor.Error('EventManager.clear', 'plugins.splashscreen.error.error_messages.not_authorized');
		}

		return EventManager.remove({hashtag: hashtag});
	},
	'EventManager.reset': (privateKey, hashtag) => {
		if (Meteor.isClient) {
			return;
		}

		new SimpleSchema({
			privateKey: {type: String},
			hashtag: {type: String}
		}).validate({
			privateKey,
			hashtag
		});

		if (!Hashtags.findOne({
				hashtag: hashtag,
				privateKey: privateKey
			})) {
			throw new Meteor.Error('EventManager.reset', 'plugins.splashscreen.error.error_messages.not_authorized');
		}

		return EventManager.update({hashtag: hashtag}, {
			$set: {
				sessionStatus: 1,
				readingConfirmationIndex: -1,
				questionIndex: -1
			}
		});
	},
	'EventManager.add': (privateKey, hashtag) => {
		if (Meteor.isClient) {
			return;
		}

		new SimpleSchema({
			privateKey: {type: String},
			hashtag: {type: String}
		}).validate({
			privateKey,
			hashtag
		});

		if (!Hashtags.findOne({
				hashtag: hashtag,
				privateKey: privateKey
			})) {
			throw new Meteor.Error('EventManager.add', 'plugins.splashscreen.error.error_messages.not_authorized');
		}

		if (EventManager.findOne({hashtag: hashtag})) {
			EventManager.remove({hashtag: hashtag});
		}

		return EventManager.insert({
			hashtag: hashtag,
			sessionStatus: 1,
			lastConnection: 0,
			readingConfirmationIndex: -1,
			questionIndex: 0
		});
	},
	'keepalive': function (privateKey, hashtag) {
		if (Meteor.isServer) {
			new SimpleSchema({
				hashtag: {type: String},
				privateKey: {type: String}
			}).validate({
				privateKey,
				hashtag
			});

			var doc = Hashtags.findOne({
				hashtag: hashtag,
				privateKey: privateKey
			});

			if (doc) {
				EventManager.update({hashtag: hashtag}, {$set: {lastConnection: (new Date()).getTime()}});
			}
		}
	}
});
