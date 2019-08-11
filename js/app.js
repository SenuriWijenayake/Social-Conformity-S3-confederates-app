var app = angular.module('app', []);
//var api = 'https://stark-sands-60128.herokuapp.com';
var api = 'http://localhost:5000';

app.controller('HomeController', function($scope, $window, $timeout) {

  $scope.user = {};

  $scope.login = function(user) {
    if (user.cues && (user.cues == 'letter' ? user.username : true)) {
      $("#index-submit-button").attr('disabled', true);
      $("#index-loader").css("display", "block");

      $window.sessionStorage.setItem('cues', user.cues);
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
  $scope.username = $window.sessionStorage.getItem('username');

  $scope.question = {};
  $scope.onbeforeunloadEnabled = true;
  $scope.qCount = 1;
  $scope.question = {};
  $scope.qOnly = false;
  $scope.currentUser = "";

  $(function() {
    if ($scope.cues == 'avatar') {
      $scope.myAvatar = 'neutral.png'
    } else {
      switch ($scope.username) {
        case 'JG':
          $scope.myAvatar = 'a.png'
          break;
        case 'NB':
          $scope.myAvatar = 'b.png'
          break;
        case 'DH':
          $scope.myAvatar = 'd.png'
          break;
        case 'BS':
          $scope.myAvatar = 'e.png'
          break;
      }
    }
  });

  //Confirmation message before reload and back
  $window.onbeforeunload = function(e) {
    if ($scope.onbeforeunloadEnabled) {
      var dialogText = 'You have unsaved changes. Are you sure you want to leave the site?';
      e.returnValue = dialogText;

      //Disconnect sockets if there are any
      if ($scope.discussion) {
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
      avatar: "qb.png",
      msg: "Hello " + $scope.username + "! Welcome to the quiz. I am the QuizBot. I will show you the feedback the real participant sees during the quiz, on the left hand side. Based on the answer assigned to you, you may chose your explanation from the script provided."
    });
  }, 2000);

  //Send a new message to the group chat. Visible to all
  socket.on('new_message', (data) => {
    $timeout(function() {
      $scope.history.push({
        name: data.username,
        msg: data.message,
        avatar: data.avatar,
        class: data.class,
        realUser: data.realUser
      });
    }, 500);
    $timeout(function() {
      $scope.scrollAdjust();
    }, 1000);
  });

  //When you get the start signal
  socket.on('ready', (data) => {
    $("#chat-text").attr("disabled", false);
    $(".send-button").css("background-color", "#117A65");
    $(".send-button").css("border", "1px solid #117A65");

    $scope.history.push({
      name: data.username,
      msg: data.message,
      avatar: data.avatar
    });
    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);
  });

  //Send a message to say that you have connected
  socket.on('connected', (data) => {
    $scope.history.push({
      msg: data.message,
      class: data.class,
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
      msg: data.message,
      avatar : data.avatar
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

  //Receive questions
  socket.on('new_question', (res) => {

    $("#chart_div").css("display", "none");
    $scope.question = res.info;
    $scope.qOnly = true;
    $scope.qCount++;

    $scope.history.push({
      name: res.username,
      msg: res.message,
      avatar : res.avatar
    });
    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);

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
    $scope.createFeedback(res.feedback);
  });

  $scope.createFeedback = function (feedback){
    $scope.controlFeedback = feedback;
    $timeout(function() {
      $("#chart_div").css("display", "block");
    }, 1000);
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
      if (handle == "done") {
        socket.emit('new_message', {
          'username': $scope.username,
          'message': $scope.message,
          'avatar' : $scope.myAvatar
        });

        $timeout(function() {
          $scope.history.push({
            name: "QuizBot",
            msg: "You may change your answer, confidence or explanation now.",
            avatar: "qb.png",
          });
        }, 2000);

      } else {
        socket.emit('new_message', {
          'username': $scope.username,
          'message': $scope.message,
          'avatar' : $scope.myAvatar
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
