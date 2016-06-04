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

import {Mongo} from 'meteor/mongo';
import {AbstractQuestionGroup} from "/lib/questions/questiongroup_abstract.js";
import {DefaultQuestionGroup} from "/lib/questions/questiongroup_default.js";
import {AbstractQuestion} from "/lib/questions/question_abstract.js";
import {DefaultAnswerOption} from "/lib/answeroptions/answeroption_default.js";
import {MultipleChoiceQuestion} from "/lib/questions/question_choice_multiple.js";

export function getLanguage() {
	return $.parseJSON(localStorage.getItem("__amplify__tap-i18n-language"));
}

export function getAllHashtags() {
	var hashtagString = localStorage.getItem("hashtags");
	if (!hashtagString) {
		localStorage.setItem("hashtags", JSON.stringify([]));
		return [];
	}
	return JSON.parse(hashtagString).sort();
}

export function containsHashtag(hashtag) {
	if (!hashtag || hashtag === "hashtags" || hashtag === "privateKey") {
		return;
	}
	const hashtagString = localStorage.getItem("hashtags");
	return hashtagString ? $.inArray(hashtag, JSON.parse(hashtagString)) > -1 : false;
}

export function deleteHashtag(hashtag) {
	if (!hashtag || hashtag === "hashtags" || hashtag === "privateKey") {
		return;
	}
	var allHashtags = JSON.parse(localStorage.getItem("hashtags"));
	if (!allHashtags) {
		return false;
	}
	var index = $.inArray(hashtag, allHashtags);
	if (index > -1) {
		localStorage.removeItem(hashtag);
		allHashtags.splice(index, 1);
		localStorage.setItem("hashtags", JSON.stringify(allHashtags));
	}
}

export function addHashtag(questionGroup) {
	if (!(questionGroup instanceof AbstractQuestionGroup)) {
		return;
	}
	const hashtagString = localStorage.getItem("hashtags");
	if (!hashtagString) {
		localStorage.setItem("hashtags", JSON.stringify([questionGroup.getHashtag()]));
		localStorage.setItem(questionGroup.getHashtag(), JSON.stringify(questionGroup.serialize()));
	} else {
		const hashtags = JSON.parse(hashtagString);
		if (!containsHashtag(questionGroup.getHashtag())) {
			hashtags.push(questionGroup.getHashtag());
			localStorage.setItem("hashtags", JSON.stringify(hashtags));
		}
		localStorage.setItem(questionGroup.getHashtag(), JSON.stringify(questionGroup.serialize()));
	}
}

export function addQuestion(questionItem) {
	if (!(questionItem instanceof AbstractQuestion)) {
		return;
	}
	const sessionDataString = localStorage.getItem(questionItem.getHashtag());
	if (sessionDataString) {
		const sessionData = JSON.parse(sessionDataString);
		if (questionItem.getQuestionIndex() < sessionData.questionList.length) {
			sessionData.questionList[questionItem.getQuestionIndex()].questionText = questionItem.getQuestionText();
		} else {
			sessionData.questionList.push(questionItem.serialize());
		}
		localStorage.setItem(questionItem.getHashtag(), JSON.stringify(sessionData));
	}
}

export function removeQuestion(hashtag, questionIndex) {
	if (!hashtag || hashtag === "hashtags" || hashtag === "privateKey") {
		return;
	}
	const sessionDataString = localStorage.getItem(hashtag);
	if (sessionDataString) {
		const sessionData = JSON.parse(sessionDataString);
		sessionData.questionList.splice(questionIndex, 1);
		localStorage.setItem(hashtag, JSON.stringify(sessionData));
	}
}

export function addTimer(hashtag, questionIndex, timer) {
	if (!hashtag || hashtag === "hashtags" || hashtag === "privateKey") {
		return;
	}
	const sessionDataString = localStorage.getItem(hashtag);
	if (sessionDataString) {
		const sessionData = JSON.parse(sessionDataString);
		sessionData.questionList[questionIndex].timer = timer;
		localStorage.setItem(hashtag, JSON.stringify(sessionData));
	}
}

export function addAnswers({hashtag, questionIndex, answerOptionNumber, answerText, isCorrect}) {
	if (!hashtag || hashtag === "hashtags" || hashtag === "privateKey") {
		return;
	}
	const sessionDataString = localStorage.getItem(hashtag);
	if (sessionDataString) {
		const sessionData = JSON.parse(sessionDataString);
		if (!sessionData.questionList[questionIndex].answers) {
			sessionData.questionList[questionIndex].answers = [];
		}
		sessionData.questionList[questionIndex].answers.push({
			answerOptionNumber: answerOptionNumber,
			answerText: answerText,
			isCorrect: isCorrect
		});
		localStorage.setItem(hashtag, JSON.stringify(sessionData));
	}
}

export function reenterSession(hashtag) {
	if (!hashtag || hashtag === "hashtags" || hashtag === "privateKey") {
		throw new TypeError("Undefined or illegal hashtag provided");
	}

	const sessionDataString = localStorage.getItem(hashtag);
	if (!sessionDataString) {
		throw new TypeError("Undefined session data");
	}

	let sessionData = JSON.parse(sessionDataString);
	if (typeof sessionData !== "object") {
		throw new TypeError("Illegal session data");
	}
	if (typeof sessionData.type === "undefined") {
		// Legacy mode -> Convert old session data to new OO style
		const newQuestionGroup = new DefaultQuestionGroup({
			hashtag: hashtag,
			questionList: [],
			musicEnabled: 1,
			musicVolume: 80,
			musicTitle: "Song1"
		});
		for (let i = 0; i < sessionData.questionList.length; i++) {
			const answerOptions = [];
			for (let j = 0; j < sessionData.questionList[i].answers.length; j++) {
				answerOptions.push(new DefaultAnswerOption({
					hashtag: hashtag,
					questionIndex: i,
					answerOptionNumber: j,
					answerText: sessionData.questionList[i].answers[j].answerText,
					isCorrect: sessionData.questionList[i].answers[j].isCorrect === 1
				}));
			}
			newQuestionGroup.addQuestion(new MultipleChoiceQuestion({
				hashtag: hashtag,
				questionIndex: i,
				questionText: sessionData.questionList[i].questionText,
				timer: sessionData.questionList[i].timer / 1000,
				startTime: 0,
				answerOptionList: answerOptions
			}));
		}
		localStorage.setItem(newQuestionGroup.getHashtag(), JSON.stringify(newQuestionGroup.serialize()));
		sessionData = newQuestionGroup.serialize();
	}

	switch (sessionData.type) {
		case "DefaultQuestionGroup":
			return new DefaultQuestionGroup(sessionData);
		default:
			throw new TypeError("Undefined session type while reentering");
	}
}

export function deleteAnswerOption(hashtag, questionIndex, answerOptionNumber) {
	if (!hashtag || hashtag === "hashtags" || hashtag === "privateKey") {
		return;
	}
	const sessionDataString = localStorage.getItem(hashtag);
	if (!sessionDataString) {
		return;
	}

	const sessionData = JSON.parse(sessionDataString);
	if (typeof sessionData === "object") {
		sessionData.questionList[questionIndex].answers = $.grep(sessionData.questionList[questionIndex].answers, function (value) {
			return value.answerOptionNumber !== answerOptionNumber;
		});

		localStorage.setItem(hashtag, JSON.stringify(sessionData));
	}
}

export function updateAnswerText({hashtag, questionIndex, answerOptionNumber, answerText, isCorrect}) {
	if (!hashtag || hashtag === "hashtags" || hashtag === "privateKey") {
		return;
	}
	const sessionDataString = localStorage.getItem(hashtag);
	if (!sessionDataString) {
		return;
	}

	const sessionData = JSON.parse(sessionDataString);
	if (typeof sessionData === "object") {
		$.each(sessionData.questionList[questionIndex].answers, function (key, value) {
			if (value.answerOptionNumber === answerOptionNumber) {
				value.answerText = answerText;
				value.isCorrect = isCorrect;
			}
		});
		localStorage.setItem(hashtag, JSON.stringify(sessionData));
	}
}

export function initializePrivateKey() {
	if (!localStorage.getItem("privateKey")) {
		localStorage.setItem("privateKey", new Mongo.ObjectID()._str);
	}
}

export function getPrivateKey() {
	return localStorage.getItem("privateKey");
}

export function importFromFile(data) {
	var hashtag = data.hashtagDoc.hashtag;
	if ((hashtag === "hashtags") || (hashtag === "privateKey")) {
		return;
	}

	var allHashtags = JSON.parse(localStorage.getItem("hashtags"));
	allHashtags = $.grep(allHashtags, function (value) {
		return value !== data.hashtagDoc.hashtag;
	});
	allHashtags.push(hashtag);
	localStorage.setItem("hashtags", JSON.stringify(allHashtags));

	var questionList = [];
	data.questionListDoc.forEach(function (questionListDoc) {
		questionList.push({
			hashtag: questionListDoc.hashtag,
			questionIndex: questionListDoc.questionIndex,
			questionText: questionListDoc.questionText,
			startTime: questionListDoc.startTime,
			timer: questionListDoc.timer,
			type: questionListDoc.type
		});
		questionListDoc.answerOptionList.forEach(function (answerOptionListDoc) {
			questionList.answerOptionList = [];
			questionList.answerOptionList.push({
				answerOptionNumber: answerOptionListDoc.answerOptionNumber,
				answerText: answerOptionListDoc.answerText,
				hashtag: answerOptionListDoc.hashtag,
				isCorrect: answerOptionListDoc.isCorrect,
				questionIndex: answerOptionListDoc.questionIndex,
				type: answerOptionListDoc.type
			});
		});
	});

	if (!data.hashtagDoc.theme) {
		data.hashtagDoc.theme = "theme-dark";
	}
	if (!data.hashtagDoc.musicVolume) {
		data.hashtagDoc.musicVolume = 80;
	}
	if (!data.hashtagDoc.musicEnabled) {
		data.hashtagDoc.musicEnabled = 1;
	}
	if (!data.hashtagDoc.musicTitle) {
		data.hashtagDoc.musicTitle = "Song1";
	}

	localStorage.setItem(hashtag, JSON.stringify({
		hashtag: data.hashtagDoc.hashtag,
		questionList: questionList,
		theme: data.hashtagDoc.theme,
		type: data.hashtagDoc.type,
		musicVolume: data.hashtagDoc.musicVolume,
		musicEnabled: data.hashtagDoc.musicEnabled,
		musicTitle: data.hashtagDoc.musicTitle
	}));
}

export function exportFromLocalStorage(hashtag) {
	var localStorageData = JSON.parse(localStorage.getItem(hashtag));
	if (!localStorageData.theme) {
		localStorageData.theme = "theme-dark";
	}
	if (!localStorageData.musicVolume) {
		localStorageData.musicVolume = 80;
	}
	if (!localStorageData.musicEnabled) {
		localStorageData.musicEnabled = 1;
	}
	if (!localStorageData.musicTitle) {
		localStorageData.musicTitle = "Song1";
	}
	if (localStorageData) {
		var hashtagDoc = {
			hashtag: localStorageData.hashtag,
			theme: localStorageData.theme,
			type: localStorageData.type,
			musicVolume: localStorageData.musicVolume,
			musicEnabled: localStorageData.musicEnabled,
			musicTitle: localStorageData.musicTitle
		};

		var questionList =  [];

		for (var i = 0; i < localStorageData.questionList.length; i++) {
			var question = localStorageData.questionList[i];
			questionList.push({
				hashtag: question.hashtag,
				questionIndex: question.questionIndex,
				questionText: question.questionText,
				startTime: question.startTime,
				timer: question.timer,
				type: question.type,
				answerOptionList: []
			});
			for (var j = 0; j < question.answerOptionList.length; j++) {
				var answer = question.answerOptionList[j];
				questionList[i].answerOptionList.push({
					hashtag: answer.hashtag,
					questionIndex: answer.questionIndex,
					answerText: answer.answerText,
					answerOptionNumber: answer.answerOptionNumber,
					isCorrect: answer.isCorrect,
					type: answer.type
				});
			}
		}

		return JSON.stringify({
			hashtagDoc: hashtagDoc,
			questionListDoc: questionList
		});
	}
}
