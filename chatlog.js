global.crypto = require('crypto')
const WebSocket = require('ws');
const fs = require('fs');
const fetch = require('node-fetch');

const Amplify = require('@aws-amplify/core');
const Auth = require('@aws-amplify/auth');
const API = require('@aws-amplify/api');
// const aws_exports = require('./aws-export')


const email = "[REDACTED]";
const pass = "[REDACTED]";

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

var uid=[];
var sid=[];
var storedMessages=[];
 
function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
   }
 }

function init(){
  fs.readFile("[REDACTED]", 'ascii', function (err, file) {
    if (err) throw err;
    let totalData = file.toString().split("\n");
    for (let i = 0; i < totalData.length; i++) {
      if (totalData[i].length!=0) {
        var dat=totalData[i].split("\r")[0].split("|");
        if(!uid.includes(dat[0])){
          uid.push(dat[0]);
          sid.push(dat[1].replace("/", "_").replace(".", "_").replace("\\", "_"));
        }
      }
    }
    for (let s = 0; s < sid.length; s++) {
      fs.exists("./logs/"+sid[s]+".dat", (exists) => {
        if (!exists) {
          fs.open("./logs/"+sid[s]+".dat", "a", function (err, file) {
            if (err) throw err;
          });
        }
      });
    }
  });

}

function connect() {
  var ws = new WebSocket('wss://broker.surrogate.tv/socket.io/?EIO=3&transport=websocket');
  // ws.reconnectInterval = 60000

  ws.on('connecting', function() {
    console.log('WebSocket Client Connecting');
  });

  ws.on('open', function open() {
    for (let i = 0; i < uid.length; i++) {
      var sub = '424["subscribe","/chat/'+uid[i]+'"]';
      ws.send(sub);
    }
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

          var gindex = uid.indexOf(str.substring(10,46));

          if (obj.message.startsWith("!test")) {
            send(obj.message.substring(6), uid[gindex]);
          }

          var toStoreObject = {
            "time": dateTime,
            "game": sid[gindex],
            "username": obj.username,
            "message": obj.message,
            "userId": obj.userId,
          };

          const n = 100; //Storage of 100 latest messages
          storedMessages.push(toStoreObject);

          if (storedMessages.length > n) {
            storedMessages = storedMessages.slice(1,storedMessages.length);
          } 


          fetch("[REDACTED]", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(toStoreObject)
          }).then(response => response.text());

          fs.appendFile("./logs/"+sid[gindex]+".dat", dateTime+" | "+obj.username+" | "+obj.message+"\n", function (err) {
            if (err) throw err;
            console.log(dateTime+" | "+sid[gindex]+"\t|\t"+obj.username+"\t|\t"+obj.message);
          });
        }else{
          var gindex = uid.indexOf(str.substring(10,46));
          fs.appendFile("./logs/"+sid[gindex]+".dat", dateTime+" | Result\n", function (err) {
            if (err) throw err;
            console.log(dateTime+" | "+sid[gindex]+"\t|\t"+"Result")
          });
        }
      }else if (str=="3") {
        // console.log(str);
      }
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

async function send(message, gameId) {
  await API.default.post('surrogateApi', '/chatMessage', {
      body: { gameId: gameId, message: message },
  });
}


init() 
console.log("Game\t|\tUsername\t|\tMessage")
console.log("--------------------------------------------------")
connect()

// send();