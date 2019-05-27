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
  $scope.qCount = 1;
  $scope.question = {};
  $scope.qOnly = false;
  $scope.currentUser = "";

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

  //Send a new message to the group chat. Visible to all
  socket.on('new_message', (data) => {
    $scope.history.push({
      name: data.username,
      msg: data.message
    });
    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);
  });

  //Send a message to say that you have connected
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

  //Receive notification as to when the user starts the quiz
  socket.on('user_started', (data) => {
    $scope.history.push({
      name: data.username,
      msg: data.message
    });
    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);

    $scope.question = data.question;
    $scope.qOnly = true;
    $scope.currentUser = data.currentUser;
    $("#qBox").css("display", "block");

    //Loader activated
    $("#loader").css("display", "block");
    $("#loader-text").css("display", "block");

  });

  socket.on('feedback', (response) => {
    var res = JSON.parse(response.info);
    //Loader deactivated
    $("#loader").css("display", "none");
    $("#loader-text").css("display", "none");

    $scope.question = res.question;
    if($scope.cues == 'Yes'){
      $scope.avatarFeedback(res.feedback);
    } else{
      $scope.createControlFeedback(res.feedback);
    }
  });

  $scope.avatarFeedback = function(data) {
    $scope.feedback = data;
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

  //Function to adjust scrolling - not working
  $scope.scrollAdjust = function() {
    var element = document.getElementById("text-area");
    element.scrollTop = element.scrollHeight;
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
            name: $scope.username,
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
          'username': $scope.username,
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
