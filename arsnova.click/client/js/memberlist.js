/*
 * This file is part of ARSnova Click.
 * Copyright (C) 2016 The ARSnova Team
 *
 * ARSnova Click is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ARSnova Click is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ARSnova Click.  If not, see <http://www.gnu.org/licenses/>.
 */

Template.memberlist.onCreated(function () {
    Session.set("questionIndex", 0);
    var oldStartTimeValues = {};

    this.autorun(() => {
        this.subscribe('MemberList.members', Session.get("hashtag"), function () {
            $(window).resize(function () {
                var final_height = $(window).height() - $(".navbar-fixed-top").outerHeight() - $(".navbar-fixed-bottom").outerHeight() - $(".fixed-bottom").outerHeight();
                $(".container").css("height", final_height + "px");
                Session.set("LearnerCountOverride", false);
                calculateButtonCount();
                calculateProgressBarTextWidth();
            });
        });
        if(Session.get("isOwner")) {
            this.subscribe('MemberList.percentRead', {
                hashtag: Session.get("hashtag"),
                privateKey: localData.getPrivateKey()
            });
            Meteor.call('Hashtags.setSessionStatus', localData.getPrivateKey(), Session.get("hashtag"), 2);
        }
        this.subscribe('QuestionGroup.memberlist', Session.get("hashtag"), function () {
            var doc = QuestionGroup.findOne();
            for(var i = 0; i< doc.questionList.length; i++) {
                oldStartTimeValues[i] = doc.questionList[i].startTime;
            }
        });
        this.subscribe('Responses.session', Session.get("hashtag"));
    });

    Tracker.autorun(function() {
        var initializing = true;
        QuestionGroup.find().observeChanges({
            changed: function (id, changedFields) {
                if(!initializing && changedFields.questionList) {
                    var question = changedFields.questionList[Session.get("questionIndex")];
                    if (question.startTime && (oldStartTimeValues[Session.get("questionIndex")] !== question.startTime)) {
                        Router.go("onpolling");
                    }
                }
            }
        });
        MemberList.find().observeChanges({
            added: function (id, newDoc) {
                calculateButtonCount();
                calculateProgressBarTextWidth();
            }
        });
        initializing = false;
    });
});

Template.memberlist.onRendered(function () {
    var final_height = $(window).height() - $(".navbar-fixed-top").outerHeight() - $(".navbar-fixed-bottom").outerHeight() - $(".fixed-bottom").outerHeight();
    $(".container").css("height", final_height + "px");
    Session.set("LearnerCountOverride", false);
    calculateButtonCount();
    calculateProgressBarTextWidth();

    var calculateFontSize = function() {
        var hashtag_length = Session.get("hashtag").length;
        //take the hastag in the middle of the logo
        var titel_margin_top  = $(".arsnova-logo").height();

        if(hashtag_length <= 10){

            if($(document).width() < 992) {
                $(".hashtag_in_title").css("font-size", "6vw");
            } else {
                $(".hashtag_in_title").css("font-size", "3vw");
            }

            if($(document).width() < 1200){
                $(".header-titel").css("font-size", "6vw");
                $(".header-titel").css("margin-top", titel_margin_top * 0.1);
            } else {
                $(".header-titel").css("font-size", "5vw");
                $(".header-titel").css("margin-top", titel_margin_top * 0.2);
            }

        } else if(hashtag_length > 10 && hashtag_length <= 15){

            if($(document).width() < 992) {
                $(".hashtag_in_title").css("font-size", "6vw");
            } else {
                $(".hashtag_in_title").css("font-size", "3vw");
            }

            $(".header-titel").css("font-size", "4vw");
            $(".header-titel").css("margin-top", titel_margin_top * 0.4);

        } else {

            if($(document).width() < 992) {
                $(".hashtag_in_title").css("font-size", "4vw");
            } else {
                $(".hashtag_in_title").css("font-size", "2vw");
            }

            $(".header-titel").css("font-size", "2.5vw");
            $(".header-titel").css("margin-top", titel_margin_top * 0.6)
        }
    }();
    $(window).resize(calculateFontSize);
});

Template.memberlist.events({
    "click .btn-more-learners": function (event) {
        Session.set("LearnerCount", MemberList.find().count());
        Session.set("LearnerCountOverride", true);
    },
    'click #setReadConfirmed': function () {
        closeSplashscreen();
        calculateProgressBarTextWidth();
    },
    'click .btn-less-learners': function () {
        Session.set("LearnerCountOverride", false);
        calculateButtonCount();
    },
    'click .btn-learner': function (event) {
        event.preventDefault();
    },
    'click #startPolling': function (event) {
        Meteor.call('Hashtags.setSessionStatus', localData.getPrivateKey(), Session.get("hashtag"), 3);
        Meteor.call('Responses.clearAll', localData.getPrivateKey(), Session.get("hashtag"));
        Meteor.call('Question.startTimer', {
            privateKey: localData.getPrivateKey(),
            hashtag: Session.get("hashtag"),
            questionIndex: Session.get("questionIndex")
        }, (err, res) => {
            if (err) {
                $('.errorMessageSplash').parents('.modal').modal('show');
                $("#errorMessage-text").html(err.reason);
            }
        });
    },
    'click #backButton':function(event){
        Meteor.call("Hashtags.setSessionStatus", localData.getPrivateKey(), Session.get("hashtag"), 1);
        Meteor.call("MemberList.removeFromSession", localData.getPrivateKey(), Session.get("hashtag"));
        Router.go("/settimer");
    }
});

Template.memberlist.helpers({
    hashtag: function () {
        return Session.get("hashtag");
    },
    isOwner: function () {
        return Session.get("isOwner");
    },
    isLearnerCountOverride: function () {
        return Session.get('LearnerCountOverride');
    },
    learners: function () {
        var sortParamObj = Session.get('LearnerCountOverride') ? {lowerCaseNick: 1} : {insertDate: -1};
        return [
            MemberList.find({nick:Session.get("nick")}, {
                limit: 1
            }),
            MemberList.find({nick: {$ne: Session.get("nick")}}, {
                limit: (Session.get("LearnerCount") - 1),
                sort: sortParamObj
            })
        ];
    },

    showMoreButton: function () {
        return ((MemberList.find().count() - Session.get("LearnerCount")) > 1);
    },

    invisibleLearnerCount: function () {
        return MemberList.find().count() - Session.get("LearnerCount");
    },

    isReadingConfirmationRequired: function () {
        const doc = QuestionGroup.findOne({hashtag: Session.get("hashtag"), questionIndex: Session.get("questionIndex")});
        return doc ? doc.isReadingConfirmationRequired === 1 : null;
    },
    isNotOwnerAndReadConfirmationNeeded: function () {
        const doc = QuestionGroup.findOne({hashtag: Session.get("hashtag"), questionIndex: Session.get("questionIndex")});
        return doc ? ( !Session.get("isOwner") && doc.isReadingConfirmationRequired === 1 ) : null;
    }
});

Template.learner.onRendered(function () {
    calculateButtonCount();
    calculateProgressBarTextWidth();
});

Template.learner.helpers({
    isOwnNick: function (nickname) {
        return nickname === Session.get("nick");
    }
});

Template.readingConfirmation.onRendered(function () {
    calculateProgressBarTextWidth();
});

Template.readingConfirmation.helpers({
    percentRead: function () {
        calculateProgressBarTextWidth();
        return getPercentRead();
    }
});

function calculateButtonCount () {

    /*
    This session variable determines if the user has clicked on the show-more-button. The button count must not
    be calculated then. It is set in the event handler of the button and is reset if the user reenters the page
     */
    if (Session.get("LearnerCountOverride")) return;

    /*
    To calculate the maximum output of attendee button rows we need to:
    - get the contentPosition height (the content wrapper for all elements)
    - subtract the confirmationCounter height (the progress bar)
    - subtract the attendee-in-quiz-wrapper height (the session information for the attendees)
    - subtract the margin to the top (the title or the show more button)
     */
    var viewport = $(".contentPosition"),
        confirmationCounter = $('.confirmationCounter').length > 0 ? $('.confirmationCounter').first().outerHeight() : 0,
        attendeeInQuiz = $('#attendee-in-quiz-wrapper').length > 0 ? $('#attendee-in-quiz-wrapper').outerHeight() : 0,
        learnerListMargin = $('.learner-list').length > 0 ? parseInt($('.learner-list').first().css('margin-top').replace("px", "")) : 0;

    var viewPortHeight =
        viewport.outerHeight() -
        confirmationCounter -
        attendeeInQuiz -
        learnerListMargin;

    /* The height of the learner button must be set manually if the html elements are not yet generated */
    var btnLearnerHeight = $('.btn-learner').first().parent().outerHeight() ? $('.btn-learner').first().parent().outerHeight() : 54;

    /* Calculate how much buttons we can place in the viewport until we need to scroll */
    var queryLimiter = Math.floor(viewPortHeight / btnLearnerHeight);

    /*
    Multiply the displayed elements by 3 if on widescreen and reduce the max output of buttons by 1 row for the display
    more button if necessary. Also make sure there is at least one row of buttons shown even if the user has to scroll
    */
    var allMembers = MemberList.find().count();
    var limitModifier = (viewport.outerWidth() >= 992) ? 3 : (viewport.outerWidth() >= 768 && viewport.outerWidth() < 992) ? 2 : 1;

    queryLimiter *= limitModifier;
    if (queryLimiter <= 0) queryLimiter = limitModifier;
    else if(allMembers > queryLimiter) {
        /*
        Use Math.ceil() as a session owner because the member buttons position may conflict with the back/forward buttons position.
        As a session attendee we do not have these buttons, so we can use Math.floor() to display a extra row
         */
        if($(".fixed-bottom").length > 0) {
            queryLimiter -= Math.ceil($('.more-learners-row').first().outerHeight() / btnLearnerHeight) * limitModifier;
        } else {
            queryLimiter -= Math.floor($('.more-learners-row').first().outerHeight() / btnLearnerHeight) * limitModifier;
        }
    }

    /*
    This session variable holds the amount of shown buttons and is used in the helper function
    Template.memberlist.helpers.learners which gets the attendees from the mongo db
     */
    Session.set("LearnerCount", queryLimiter);
}

function calculateProgressBarTextWidth () {
    /*
     * In chrome the width is always set 20% too high. In all other browsers either this and the original calculation
     * (e.g. $('.progress-fill').width((getPercentRead()) + "%");) works as expected. The function returns the correct
     * percent values so no other manipulation is needed. This could be a chrome bug and is perhaps fixed later.
    */
    var progressFill = $('.progress-fill');
    var percentRead = getPercentRead();
    progressFill.width((percentRead - 20) + "%");

    if (percentRead === 100) {
        progressFill.addClass('round-corners-right');
    } else {
        progressFill.removeClass('round-corners-right');
    }

    if (percentRead === 0) {
        progressFill.hide();
    } else {
        progressFill.show();
    }
}

function getPercentRead () {
    var sumRead = 0;
    var count = 0;
    MemberList.find({hashtag: Session.get("hashtag")}).map(function (member) {
        count++;
        sumRead += member.readConfirmed;
    });
    return count ? Math.floor(sumRead / count * 100) : 0;
}