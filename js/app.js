var app = angular.module('app', []);
//var api = 'https://stark-sands-60128.herokuapp.com';
var api = 'http://localhost:5000';

app.controller('HomeController', function($scope, $window, $timeout) {

  $scope.user = {};

  $scope.login = function(user) {
    if (user.cues && user.gender && user.username) {

      $("#index-submit-button").attr('disabled', true);
      $("#index-loader").css("display", "block");

      $window.sessionStorage.setItem('cues', user.cues);
      $window.sessionStorage.setItem('gender', user.gender);
      $window.sessionStorage.setItem('username', user.username);

      $timeout(function() {
          $window.location.href = './chat.html';
      }, 2000);

    }
  };
});

app.controller('QuizController', function($scope, $http, $window, $timeout) {

  $scope.discussion = 'Yes';
  $scope.cues = $window.sessionStorage.getItem('cues');
  $scope.gender = $window.sessionStorage.getItem('gender');
  $scope.username = $window.sessionStorage.getItem('username');

  $scope.question = {};
  $scope.onbeforeunloadEnabled = true;

  //Confirmation message before reload and back
  $window.onbeforeunload = function(e) {
    if ($scope.onbeforeunloadEnabled) {
      var dialogText = 'You have unsaved changes. Are you sure you want to leave the site?';
      e.returnValue = dialogText;

      //Disconnect sockets if there are any
      if($scope.discussion){
        socket.disconnect();
      }
      return dialogText;
    }
  };

  //Connecting the client to the socket
  $scope.userState = 'ready';
  $scope.history = [];
  var socket = io.connect('http://localhost:5000');
  socket.emit('new_connection', {
    'username': $scope.username
  });

  //Sending the initial messages
  $timeout(function() {
    $scope.history.push({
      name: "QuizBot",
      msg: "Hello " + $scope.username + "! Welcome to the quiz."
    });
  }, 1000);

  $timeout(function() {
    $scope.history.push({
      name: "QuizBot",
      msg: "You will be given prompts"});
  }, 2000);

  socket.on('new_message', (data) => {
    $scope.history.push({
      name: data.username,
      msg: data.message
    });
    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);
  });

  socket.on('connected', (data) => {
    $scope.history.push({
      name: data.username,
      msg: data.message
    });
    $timeout(function() {
      $scope.scrollAdjust();
      $("#chat-text").focus();
    }, 1000);
  });



  $scope.avatarFeedback = function(data) {
    $scope.feedback = data;
    $("#loader").css("display", "none");
    $("#loader-text").css("display", "none");

    $("#avatar_div").css("display", "block");

    if ($scope.cues == 'No' && $scope.discussion == 'No') {
      $timeout(function() {
        $("#change-section-ncnd").css("display", "block");
      }, 2000);
    } else if ($scope.cues == 'Yes' && $scope.discussion == 'No') {
      $timeout(function() {
        $("#change-section-cnd").css("display", "block");
      }, 2000);
    } else {
      $timeout(function() {
        $("#change-section").css("display", "block");
      }, 2000);
    }

  };

  $scope.createControlFeedback = function(feedback) {
    $scope.controlFeedback = feedback;
    $("#loader").css("display", "none");
    $("#loader-text").css("display", "none");

    $("#chart_div").css("display", "block");

    if ($scope.cues == 'No' && $scope.discussion == 'No') {
      $timeout(function() {
        $("#change-section-ncnd").css("display", "block");
      }, 2000);
    } else if ($scope.cues == 'Yes' && $scope.discussion == 'No') {
      $timeout(function() {
        $("#change-section-cnd").css("display", "block");
      }, 2000);
    } else {
      $timeout(function() {
        $("#change-section").css("display", "block");
      }, 2000);
    }
  };

  $scope.next = function() {
    //Remove the question area and chart area
    $("#question-area").css("display", "none");
    $("#chart-area").css("display", "none");
    $("#avatar-area").css("display", "none");

    $("#change-section").css("display", "none");
    $("#change-section-ncnd").css("display", "none");
    $("#change-section-cnd").css("display", "none");

    $scope.count = 0;

    //Make the input enabled and submit invisible
    $("input[type=radio]").attr('disabled', false);
    $("input[type=range]").attr('disabled', false);
    $(".explanation-box").attr('disabled', false);

    $("#submit-button").css("display", "none");
    $("#confidence-container").css("display", "none");
    $("#change-section").css("border", "none");

    //Handling the ending of the quiz and directing to the big five questionnaire
    if ($scope.currentQIndex == 17) {
      //Disable the confirmation message
      $scope.onbeforeunloadEnabled = false;
      //Save chat messages to the database
      var data = {
        userId: $scope.userId,
        chats: JSON.parse(angular.toJson($scope.history))
      };

      $http({
        method: 'POST',
        url: api + '/saveChats',
        data: data,
        type: JSON,
      }).then(function(response) {
          console.log("Chat messages saved successfully.");
          $window.location.href = './big-five.html';
        },
        function(error) {
          console.log("Error occured when saving the chat messages.");
        });
    } else {
      $scope.userId = $window.sessionStorage.getItem('userId');
      var data = {
        id: $scope.order[$scope.currentQIndex]
      };

      $http({
        method: 'POST',
        url: api + '/question',
        data: data,
        type: JSON,
      }).then(function(response) {

        //Display the new question area and chart area
        $("#question-area").css("display", "block");
        $("#chart-area").css("display", "block");
        $("#avatar-area").css("display", "block");
        // $("#change-section").css("display", "block");

        $scope.myAnswer = {};
        $scope.sliderChanged = false;
        $scope.explained = false;
        $scope.myAnswer.confidence = 50;
        $(".explanation-box").val("");
        $scope.question = response.data;

        if ($scope.question.img) {
          $("#image-container").css("display", "inline");
        } else {
          $("#image-container").css("display", "none");
        }

        $("#loader").css("display", "none");
        $("#loader-text").css("display", "none");
        $("#chart_div").css("display", "none");
        $("#avatar_div").css("display", "none");

        $("#change-section").css("display", "none");
        $("#change-section-ncnd").css("display", "none");
        $("#change-section-cnd").css("display", "none");

        $("#submit-button").prop("disabled", false);
        $("#output").val("Not Specified");
        $("#output").css("color", "red");

        $scope.currentQIndex += 1;

      }, function(error) {
        console.log("Error occured when loading the question");
      });
    }
  };

  //Function to adjust scrolling - not working
  $scope.scrollAdjust = function() {
    var element = document.getElementById("text-area");
    element.scrollTop = element.scrollHeight;
  };




  $scope.go = function() {

    $("#question-area").css("display", "inline");
    $("#qBox").css("border", "solid red");

    $scope.history.push({
      name: "QuizBot",
      msg: "You just started the quiz!"
    });

    $scope.userState = "started"; //Started the quiz
    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);
  };


  //Call sendMessage on Enter
  var chatBox = document.getElementById("chat-text");

  // Execute a function when the user releases a key on the keyboard
  chatBox.addEventListener("keyup", function(event) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      document.getElementById("sendButton").click();
    }
  });

  $scope.sendMessage = function() {
    if ($scope.message != undefined && $scope.message.trim().length != 0) {
      //Handle requests
      var handle = $scope.message.toLowerCase();
      if (handle == 'go') {
        if ($scope.userState == "ready") {
          $scope.history.push({
            name: $scope.currentUsername,
            msg: $scope.message
          });
          $scope.go();

        } else {
          $scope.history.push({
            name: "QuizBot",
            msg: "You have already started the quiz."
          });
        }
        $scope.message = "";
      } else {
        socket.emit('new_message', {
          'username': $scope.currentUsername,
          'message': $scope.message
        });
      }

      $scope.message = "";
      $timeout(function() {
        $scope.scrollAdjust();
      }, 500);
    }
  };

  $scope.isKeyAvailable = function(key, obj) {
    for (var i = 0; i < obj.length; i++) {
      if (key == obj[i].key) {
        return i;
      }
    }
    return -1;
  };

});
