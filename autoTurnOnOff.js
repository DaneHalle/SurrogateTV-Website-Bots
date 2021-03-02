global.crypto = require('crypto')
const WebSocket = require('ws');
const ms = require("ms");
const fetch = require('node-fetch');
const Amplify = require('@aws-amplify/core');
const Auth = require('@aws-amplify/auth');
const API = require('@aws-amplify/api');


const email = "[REDACTED]";
const pass = "[REDACTED]";

const gameID = "a5b5618d-1705-4f3a-b314-fa88f6758d3e"; //startrek

var state = true;
var running = true;

const TIMEZONE_OFFSET_GMT = 5;

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


async function autoOnOff() {
    while (true) {
        const {list} = fetch("https://g9b1fyald3.execute-api.eu-west-1.amazonaws.com/master/games/" + gameID, {
            method: 'GET', headers: {
                'Content-Type': 'application/json',
            },
        }).then(response => response.json())
            .then((x) => {
                if (x == null || x.result == null || x.result.schedule == null) {
                    let scheduleHour = null;
                } else {

                    const date = getDateObject(TIMEZONE_OFFSET_GMT);
                    let output = "";
                    let adjustedMinute = date.minute + date.hour * 60 +(date.weekdayNr-1) * 1440;
                    let nearestStartTime = x.result.schedule.findIndex(z => Math.abs(adjustedMinute - z.startTime) < 20);

                    if (!(nearestStartTime === -1) && running) {
                        console.log("Checking");
                        let startTime = x.result.schedule[nearestStartTime].startTime;
                        let endTime = startTime+x.result.schedule[nearestStartTime].duration;
                        if (startTime - adjustedMinute === 0 ) {
                            console.log("gameON");
                            auto(true);
                        }
                        if (endTime - adjustedMinute === 0) {
                            console.log("gameOFF");
                            auto(false);
                        }
                    }
                }
            });
        await Sleep(60000); //1 minute
    }
}

async function send(message, gameId) {
  await API.default.post('surrogateApi', '/chatMessage', {
      body: { gameId: gameId, message: message },
  });
}

async function toggle() {
  await API.default.patch('surrogateApi', '/games/'+gameID, {
      body: { isOnline: state },
  });
  if(state){
    state=false;
  }else{
    state=true;
  }
}

async function auto(tog) {
  await API.default.patch('surrogateApi', '/games/'+gameID, {
      body: { isOnline: tog },
  });
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

          if ((obj.username == "umepinball" || obj.username == "switch3" || obj.username == "Mordecai") && obj.message.startsWith("!stop")) {
            running = false;
            send("Game automatic turn off/on turned off", gameID);
          }
          if ((obj.username == "umepinball" || obj.username == "switch3" || obj.username == "Mordecai") && obj.message.startsWith("!start")) {
            running = true;
            send("Game automatic turn off/on turned on", gameID);
          }
          if ((obj.username == "umepinball" || obj.username == "switch3" || obj.username == "Mordecai") && obj.message.startsWith("!status")) {
            if (running) {
              send("Game automatic turn off/on is currently turned on", gameID);
            } else {
              send("Game automatic turn off/on is currently turned off", gameID);
            }
          }

          if ((obj.username == "umepinball" || obj.username == "switch3" || obj.username == "Mordecai") && obj.message.startsWith("!toggle")) {
            toggle();
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

function getDateObject(timezoneOffset) {
  const date = new Date();
  date.setHours(date.getHours() + timezoneOffset);
  const monthLeadZero = ("0" + (date.getMonth() + 1).toString()).slice(-2);
  const dayLeadZero = ("0" + date.getDate().toString()).slice(-2);
  const hourLeadZero = ("0" + date.getHours().toString()).slice(-2);
  const hourAMPM = (date.getHours() % 12 === 0) ? 12 : (date.getHours() % 12);
  const hourAMPMLeadZero = ("0" + hourAMPM).slice(-2);
  const minuteLeadZero = ("0" + date.getMinutes().toString()).slice(-2);
  const secondLeadZero = ("0" + date.getSeconds().toString()).slice(-2);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    month00: monthLeadZero,
    monthName: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][date.getMonth()],
    monthNameShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()],
    day: date.getDate(),
    weekdayNr: (date.getDay() === 0) ? 7 : date.getDay(),
    day00: dayLeadZero,
    dayOrdinal: date.getDate().toString() + ["th", "st", "nd", "rd"][(date.getDate() === 11 || date.getDate() === 12 || (date.getDate() % 10 > 3)) ? 0 : date.getDate() % 10],
    weekday: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()],
    hour: date.getHours(),
    hour00: hourLeadZero,
    minute: date.getMinutes(),
    minute00: minuteLeadZero,
    second: date.getSeconds(),
    second00: secondLeadZero,
    timeValueSeconds: Math.floor(date.valueOf() / 1000),
    
    timeString: hourLeadZero + ":" + minuteLeadZero + ":" + secondLeadZero,
    timeStringAMPM: hourAMPMLeadZero + ":" + minuteLeadZero + ":" + secondLeadZero + " " + ((date.getHours() < 12) ? "AM" : "PM"),
    
    dateString_MDY_dash: monthLeadZero + "-" + dayLeadZero + "-" + date.getFullYear().toString(),
    dateString_YMD_dash: date.getFullYear().toString() + "-" + monthLeadZero + "-" + dayLeadZero,
    dateString_DMY_slash: dayLeadZero + "/" + monthLeadZero + "/" + date.getFullYear().toString(),
    dateString_MDY_noLead:  (date.getMonth() + 1).toString() + "-" +date.getDate().toString() + "-" + date.getFullYear().toString(),
    dateString_MD_slash: (date.getMonth() + 1).toString() + "/" + date.getDate(),
  };
}

function Sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

connect();
autoOnOff();