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

var countdown = null;
var aktBtn = 0;
var lastBtn = 0;
Template.votingview.onCreated(function () {
    this.autorun(() => {
        this.subscribe('AnswerOptions.public', Session.get("hashtag"), function () {
            var answerOptionCount = AnswerOptions.find().count();
            var responseArr = [];
            for (var i = 0; i <answerOptionCount; i++) {
                responseArr[i] = false;
            }
            Session.set("responses", JSON.stringify(responseArr));
        });
        this.subscribe('Sessions.question', Session.get("hashtag"), function () {
            countdown = new ReactiveCountdown(Sessions.findOne().timer / 1000,{
                tick: function() {
                    var btnsCount = $('.answer-row').children().length;

                    /* skip the selected answer options
                    if ( $('#'+aktBtn).hasClass('answer-selected') ) {
                        aktBtn++;
                        if(aktBtn>=btnsCount) aktBtn = 0;
                    }

                    if(aktBtn==0) lastBtn = btnsCount-1;
                    else lastBtn = aktBtn-1;

                    if ( $('#'+aktBtn).hasClass('answer-selected') ) {
                        aktBtn++;
                        if(aktBtn>=btnsCount-1) aktBtn = 0;

                        var i = lastBtn;
                        while($('#'+i).hasClass('answer-selected')){
                            i--;
                        }
                        lastBtn = i;
                    }*/
                    if(aktBtn==0)   lastBtn = btnsCount-1;
                    else            lastBtn = aktBtn-1;

                    $('#' + lastBtn).removeClass('button-green-transition');
                    $('#' + lastBtn).addClass('button-purple-transition');
                    $('#' + aktBtn).addClass('button-green-transition');
                    $('#' + aktBtn).removeClass('button-purple-transition');

                    aktBtn++;
                    if(aktBtn>=btnsCount) aktBtn = 0;
                }
            });
            countdown.start(function () {
                Session.set("sessionClosed", true);
                $("#end-of-polling-text").html("Game over");
                $('.js-splashscreen-end-of-polling').modal('show');
            });
            Session.set("countdownInitialized", true);
        });
    });
    Meteor.call('Sessions.isSC', {
        hashtag: Session.get("hashtag")
    }, (err, res) => {
        if (err) {
        } else {
            if (res) {
                Session.set("questionSC", res);
            }
        }
    });
    $(window).resize(function () {
        formatAnswerButtons();
    });
});

Template.votingview.rendered = function () {
    formatAnswerButtons();
};

Template.votingview.helpers({
    answerOptions: function () {
        return AnswerOptions.find({}, {sort:{answerOptionNumber: 1}});
    },
    showForwardButton: function () {
        return Session.get("hasToggledResponse");
    },
    answerOptionLetter: function (number) {
        return String.fromCharCode((number.hash.number + 65));
    },
    getCountdown: function () {
        if (Session.get("countdownInitialized")) {
            return "Noch " + countdown.get() + " Sekunden!";
        }
    }
});

Template.votingview.events({
    "click #js-btn-showQuestionModal": function () {
        $('.questionContentSplash').parents('.modal').modal();
    },
    "click #js-showAnswerTexts": function () {
        $('.answerTextSplash').parents('.modal').modal();
    },
    "click #forwardButton": function () {
        var responseArr = JSON.parse(Session.get("responses"));
        for (var i = 0; i < AnswerOptions.find().count(); i++ ) {
            if (responseArr[i]) {
                makeAndSendResponse(i);
            }
        }
        Session.set("showForwardButton", undefined);
        Session.set("countdownInitialized", undefined);
        Session.set("hasGivenResponse", undefined);
        Session.set("responses", undefined);
        $('.js-splashscreen-end-of-polling').modal('show');
    },
    "click .sendResponse": function (event) {
        if (Session.get("questionSC")) {
            makeAndSendResponse(event.currentTarget.id);
        }
        else {
            var responseArr = JSON.parse(Session.get("responses"));
            var currentId = event.currentTarget.id;
            if (responseArr[currentId]) {
                responseArr[currentId] = false;
            } else {
                responseArr[currentId] = true;
            }
            var hasToggledResponse = false;
            responseArr.forEach(function (number) {
                if (number) {
                    hasToggledResponse = true;
                }
            });
            Session.set("hasToggledResponse", hasToggledResponse);
            Session.set("responses", JSON.stringify(responseArr));
            $(event.target).toggleClass("answer-selected");
        }
    }
    // submit button onclick -> feedback splashscreen + redirect
});

function makeAndSendResponse(answerOptionNumber) {
    Meteor.call('Responses.addResponse', {
        hashtag: Session.get("hashtag"),
        answerOptionNumber: Number(answerOptionNumber),
        userNick: Session.get("nick")
    }, (err, res) => {
        if (err) {
            $('.errorMessageSplash').parents('.modal').modal('show');
            $("#errorMessage-text").html(err.reason);
        } else {
            if (res) {
                if (res.instantRouting) {
                    // singlechoice
                    $('.js-splashscreen-end-of-polling').modal('show');
                    Session.set("hasGivenResponse", undefined);
                    Session.set("countdownInitialized", undefined);
                    Session.set("responses", undefined);
                }
            }
        }
    });
}

function calculateAnswerRowHeight () {
    return $(window).height() - $('.header-title').height() - $('#appTitle').height() - $('.voting-helper-buttons').height() - $('.navbar-fixed-bottom').height() - 15;
}

function formatAnswerButtons () {
    var answerRow = $('.answer-row');
    var answerButtonContainerHeight = calculateAnswerRowHeight();
    answerRow.css('height', answerButtonContainerHeight + 'px');

    var answerOptionsCount = answerRow.children().length;
    if (answerOptionsCount == 0) {
        setTimeout(function () {
            formatAnswerButtons();
        }, 100);
        return;
    }

    var buttonHeight = 0;
    answerRow.children().removeClass('col-xs-12').removeClass('col-xs-6').removeClass('col-xs-4');

    if (answerOptionsCount <= 3) {
        answerButtonContainerHeight -= answerOptionsCount * 30;
        answerRow.children().addClass('col-xs-12');
        buttonHeight = answerButtonContainerHeight / answerOptionsCount;
    } else if (answerOptionsCount <= 6) {
        answerButtonContainerHeight -= Math.ceil((answerOptionsCount / 2)) * 30;
        answerRow.children().addClass('col-xs-6');
        buttonHeight = answerButtonContainerHeight / (Math.ceil(answerOptionsCount / 2));
    } else {
        answerButtonContainerHeight -= Math.ceil((answerOptionsCount / 3)) * 30;
        answerRow.children().addClass('col-xs-4');
        buttonHeight = answerButtonContainerHeight / (Math.ceil(answerOptionsCount / 3));
    }

    answerRow.find('button').css('height', buttonHeight + 'px');
}

function changeButtonColor() {

}