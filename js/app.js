var app = angular.module('app', []);
var api = 'https://mysterious-badlands-68636.herokuapp.com';
// var api = 'http://localhost:5000';

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
  var x;

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

  $scope.startTimer = function() {
    // Set the date we're counting down to
    var dt = new Date();
    dt.setMinutes(dt.getMinutes() + 2);
    var countDownDate = dt;

    // Update the count down every 1 second

    x = setInterval(function() {
      // Get today's date and time
      var now = new Date().getTime();
      // Find the distance between now and the count down date
      var distance = countDownDate - now;
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Display the result in the element with id="demo"
      document.getElementById("timer").innerHTML = "Time reamining : " + minutes + "m " + seconds + "s ";

      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(x);
      }
    }, 1000);
  };

  //Confirmation message before reload and back
  $window.onbeforeunload = function(e) {
    if ($scope.onbeforeunloadEnabled) {
      var dialogText = 'You have unsaved changes. Are you sure you want to leave the site?';
      e.returnValue = dialogText;
      //Disconnect sockets if there are any
      if ($scope.discussion == 'Yes') {
        socket.disconnect();
      }
      return dialogText;
    }
  };

  //Function to get timestamp
  $scope.getTimestamp = function() {
    // return new Date().toUTCString();
    var dt = new Date();
    dt.setHours(dt.getHours() + 10);
    return dt.toUTCString();
  };

  //Connecting the client to the socket
  $scope.userState = 'ready';
  $scope.history = [];
  var socket = io.connect('https://mysterious-badlands-68636.herokuapp.com');
  // var socket = io.connect('http://localhost:5000');
  socket.emit('new_connection', {
    'username': $scope.username
  });

  //Sending the initial messages
  $timeout(function() {
    $scope.history.push({
      name: "QuizBot",
      avatar: "qb.png",
      timestamp: $scope.getTimestamp(),
      msg: "Hello " + $scope.username + "! Welcome to the quiz. I am the QuizBot. I will show you the feedback the real participant sees during the quiz, on the left hand side. Based on the answer assigned to you, you may chose your explanation from the script provided."
    });
  }, 2000);

  //Send a new message to the group chat. Visible to all
  socket.on('making_changes', (data) => {
    $timeout(function() {
      $scope.history.push({
        name: data.username,
        msg: data.message,
        avatar: data.avatar,
        realUser: data.realUser,
        timestamp: $scope.getTimestamp()
      });
    }, 500);
    $timeout(function() {
      $scope.scrollAdjust();
    }, 1000);
  });

  //Socket on done
  socket.on('done', (data) => {

    clearInterval(x);
    $("#timer").css("display", "none");
    document.getElementById("timer").innerHTML = "Time reamining : 2m 00s";

    $timeout(function() {
      $scope.history.push({
        name: data.username,
        msg: data.message,
        class: data.class,
        timestamp: $scope.getTimestamp(),
        avatar: data.avatar,
        realUser: data.realUser
      });
    }, 100);

    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);
  });

  //Send a new message to the group chat. Visible to all
  socket.on('new_message', (data) => {
    $timeout(function() {
      $scope.history.push({
        name: data.username,
        msg: data.message,
        avatar: data.avatar,
        timestamp: $scope.getTimestamp(),
        class: data.class,
        realUser: data.realUser
      });
    }, 100);

    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);
  });

  //When you get the start signal
  socket.on('ready', (data) => {
    $timeout(function() {
      $scope.history.push({
        name: data.username,
        msg: data.message,
        timestamp: $scope.getTimestamp(),
        avatar: data.avatar
      });
    }, 100);

    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);
  });

  //Send a message to say that you have connected
  socket.on('connected', (data) => {
    $scope.history.push({
      msg: data.message,
      timestamp: $scope.getTimestamp(),
      class: data.class,
    });
    $timeout(function() {
      $scope.scrollAdjust();
      $("#chat-text").focus();
    }, 1000);
  });

  //Receive notification as to when the user starts the quiz
  socket.on('user_started', (data) => {

    //Disable the chat
    $("#chat-text").attr("disabled", true);
    $(".send-button").css("background-color", "grey");
    $(".send-button").css("border", "1px solid grey");

    $timeout(function() {
      $scope.history.push({
        name: data.username,
        msg: data.message,
        timestamp: $scope.getTimestamp(),
        avatar: data.avatar
      });
    }, 100);

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

    //Disable the chat box
    $("#chat-text").attr("disabled", true);
    $(".send-button").css("background-color", "grey");
    $(".send-button").css("border", "1px solid grey");

    $("#chart_div").css("display", "none");
    $scope.question = res.info;
    $scope.qOnly = true;
    $scope.qCount++;

    $timeout(function() {
      $scope.history.push({
        name: res.username,
        msg: res.message,
        timestamp: $scope.getTimestamp(),
        avatar: res.avatar
      });
    }, 100);

    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);

    $("#qBox").css("display", "block");
    //Loader activated
    $("#loader").css("display", "block");
    $("#loader-text").css("display", "block");

  });

  socket.on('quiz_completed', (response) => {

    $timeout(function() {
      $scope.history.push({
        name: data.username,
        msg: data.message,
        avatar: data.avatar,
        timestamp: $scope.getTimestamp(),
        class: data.class,
        realUser: data.realUser
      });
    }, 100);

    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);

  $timeout(function() {
    socket.disconnect();
    $window.location.href = './index.html';
  }, 1000);

});

socket.on('feedback', (response) => {
  var res = JSON.parse(response.info);
  //Loader deactivated
  $("#loader").css("display", "none");
  $("#loader-text").css("display", "none");
  $scope.question = res.question;
  $scope.createFeedback(res.feedback);
  $scope.getMyQuote(res.feedback);
});

socket.on('start_timer', (response) => {
  console.log("Starting timer");
  $scope.startTimer();
  $("#timer").css("display", "block");
  //Enable the chat box
  $("#chat-text").attr("disabled", false);
  $(".send-button").css("background-color", "#117A65");
  $(".send-button").css("border", "1px solid #117A65");
});


$scope.getMyQuote = function(feedback){
  for (var i = 0; i < feedback.length; i++){
    if(feedback[i].username == $scope.username){
      $scope.message = feedback[i].quote;
    }
  }
};

socket.on('time_up', (data) => {

  clearInterval(x);
  $("#timer").css("display", "none");
  document.getElementById("timer").innerHTML = "Time reamining : 2m 00s";

  //Disable the chat box
  $("#chat-text").attr("disabled", true);
  $(".send-button").css("background-color", "grey");
  $(".send-button").css("border", "1px solid grey");

  $timeout(function() {
    $scope.history.push({
      name: data.username,
      msg: data.message,
      avatar: data.avatar,
      timestamp: $scope.getTimestamp(),
      class: data.class,
      realUser: data.realUser
    });
  }, 100);
  $timeout(function() {
    $scope.scrollAdjust();
  }, 500);
});

$scope.createFeedback = function(feedback) {
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
      clearInterval(x);
      $("#timer").css("display", "none");
      document.getElementById("timer").innerHTML = "Time reamining : 2m 00s";

      socket.emit('done', {
        'username': $scope.username,
        'message': $scope.message,
        'avatar': $scope.myAvatar,
        'realUser': false
      });

    } else {
      socket.emit('new_message', {
        'username': $scope.username,
        'message': $scope.message,
        'avatar': $scope.myAvatar
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
