Template.createQuestionView.onCreated(function () {
    this.autorun(() => {
        this.subscribe('Sessions.instructor', localData.getPrivateKey(), Session.get("hashtag"));
    });
});

Template.createQuestionView.helpers({
    //Get question from Sessions-Collection if it already exists
    questionText: function () {
        var currentSession = Sessions.findOne({hashtag: Session.get("hashtag")});
        if (currentSession) {
            return currentSession.questionText;
        }
        else {
            return "";
        }
    }
});

Template.createQuestionView.events({
    //Save question in Sessions-Collection when Button "Next" is clicked
    'click #forwardButton': function () {
        var questionText = $('#questionText').val();
        Meteor.call("Sessions.setQuestion", {
            privateKey: localData.getPrivateKey(),
            hashtag: Session.get("hashtag"),
            questionText: questionText
        }, (err, res) => {
            if (err) {
                alert(err);
            } else {
                localData.addQuestion(Session.get("hashtag"), questionText);
                Router.go("/answeroptions");
            }
        });


    },
    "click #backButton": function () {
        var questionText = $('#questionText').val();
        Session.set("hashtag", undefined);
        Session.set("isOwner", undefined);
        Router.go("/");
    },
    "click #formatButton": function () {
        //Not implemented yet
    },
    "click #previewButton": function () {
        //Not implemented yet
    }
});;
