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
 * along with ARSnova Click.  If not, see <http://www.gnu.org/licenses/>.*/

import { Session } from 'meteor/session';
import { EventManager } from '/lib/eventmanager.js';
import { AnswerOptions } from '/lib/answeroptions.js';
import { MemberList } from '/lib/memberlist.js';
import { Responses } from '/lib/responses.js';

function getLeaderBoardItemsByIndex (index) {
    var allGoodMembers = [];
    var param = {isCorrect: 1};
    param.questionIndex = index;
    var rightAnswerOptions = AnswerOptions.find(param);
    delete param.isCorrect;

    MemberList.find({}, {fields: {nick: 1}}).forEach(function (member) {
        param.userNick = member.nick;
        var userResponses = Responses.find(param);
        delete param.userNick;
        var userHasRightAnswers = true;
        // only put member in leaderboard when he clicked the right amount, then check whether he clicked all the right ones
        var totalResponseTime = 0;
        if ((userResponses.count() === rightAnswerOptions.count()) && (userResponses.count() > 0) && userHasRightAnswers) {
            userResponses.forEach(function (userResponse) {
                param.isCorrect = 1;
                param.answerOptionNumber = userResponse.answerOptionNumber;
                var checkAnswerOptionDoc = AnswerOptions.findOne(param);
                delete param.isCorrect;
                delete param.answerOptionNumber;
                if (!checkAnswerOptionDoc) {
                    userHasRightAnswers = false;
                } else {
                    totalResponseTime += userResponse.responseTime;
                }
            });
            if (userHasRightAnswers) {
                allGoodMembers.push({
                    nick: member.nick,
                    responseTime: totalResponseTime / rightAnswerOptions.count()
                });
            }
        }
    });

    //check if the show all button was pressed
    if (Session.get('show_all_leaderboard')) {
        return _.sortBy(allGoodMembers, 'responseTime');
    } else {
        return _.sortBy(allGoodMembers, 'responseTime').slice(0, 6);
    }
}

export function getLeaderBoardItems () {
    if (typeof Session.get("showLeaderBoardId") !== "undefined") {
        return [{value: getLeaderBoardItemsByIndex(Session.get("showLeaderBoardId"))}];
    } else {
        if (!EventManager.findOne()) {
            return [];
        }

        var result = [];
        for (var i = 0; i <= EventManager.findOne().questionIndex; i++) {
            result.push({
                index: i,
                value: getLeaderBoardItemsByIndex(i)
            });
        }

        return result;
    }
}