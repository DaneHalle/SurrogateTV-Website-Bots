global.crypto = require('crypto')
const WebSocket = require('ws');
const fetch = require('node-fetch');
const Amplify = require('@aws-amplify/core');
const Auth = require('@aws-amplify/auth');
const API = require('@aws-amplify/api');


const email = "[REDACTED]";
const pass = "[REDACTED]";
const gameID = "[REDACTED]";

var state = true;

var wins = [];

Amplify.default.configure(
  {
    Auth: {
      mandatorySignIn: true,
      region: 'eu-west-1',
      userPoolId: 'eu-west-1_QXXmJLzeq',
      identityPoolId: 'eu-west-1:ee88318e-0a8e-402d-906d-763c933f0482',
      userPoolWebClientId: 'u6gie8rc4jvvgusmpo3k7thtv',
    },
    API: {
      endpoints: [
        {
          name: 'surrogateApi',
          endpoint:
            'https://g9b1fyald3.execute-api.eu-west-1.amazonaws.com/master',
          region: 'eu-west-1',
        },
      ],
    },
  });

Auth.default.signIn(email, pass)
  .then(success => console.log('successful sign in'))
  .catch(err => console.log(err));

async function send(message, gameId) {
  await API.default.post('surrogateApi', '/chatMessage', {
      body: { gameId: gameId, message: message },
  });
}

async function toggle(gameId) {
  await API.default.patch('surrogateApi', '/games/'+gameId, {
      body: { isOnline: state },
  });
  if(state){
    state=false;
  }else{
    state=true;
  }
}

function connect() {
  var ws = new WebSocket('wss://broker.surrogate.tv/socket.io/?EIO=3&transport=websocket');
  // ws.reconnectInterval = 60000

  ws.on('connecting', function() {
    console.log('WebSocket Client Connecting');
  });

  ws.on('open', function open() {
    var sub = '424["subscribe","/chat/'+gameID+'"]';
    ws.send(sub);
  });
    
  ws.on('message', function incoming(data) {
      str = data.replace(/\r?\n|\r/g, "");
      // console.log(str)
      if(!str.includes('[{"status":"ok"}]') && str!='40' && str.substring(0,1)!='0' && str!="3"){
        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date+' '+time;
        var obj = JSON.parse(str.substring(48, str.length-1));
        if(obj.type=="chatMessage"){


          if (obj.message.startsWith("!test")) {
            send(obj.message.substring(6), gameID);
          }

          if (obj.message.startsWith("!toggle")) {
            toggle(gameID);
          }
 
        }
      }
      //42["/games/7dbf5eb8-bdc9-4341-a654-79f16817ebf2/stream",{"timestamp":1608574156001,"eventType":"gameState","payload":{"state":"setup","didEnd":false,"gameSpecificState":{"players":[{"username":"Mordecai","score":-1,"robotInfo":{"seat":0,"set":0,"robotId":"mini-claw-3robot","queueOptionId":"0"}}],"currentPlayer":""}}}]
      //42["/chat/7dbf5eb8-bdc9-4341-a654-79f16817ebf2",{"type":"gameScore","scoreType":"totalWins","sortOrder":"descending","scoreInfo":[{"username":"BroStas","score":1}]}]
      });

  ws.on('close', function(e) {
    console.log("Connection closed because "+e)
      setTimeout(function() {
          connect();
        }, 500);
  });

  ws.on('error', function() {
    console.log('WebSocket error');
  });
      
        function tick() {
          //get the mins of the current time
          var mins = new Date().getMinutes();
          if (mins == "00") {
            ws.close()
          }

          
          ws.send("2")
        }
        
        setInterval(tick, 5000);
}

connect()