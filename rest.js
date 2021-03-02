const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3000;
const n = 100; 

let messages = [];

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/chat', (req, res) => {
	const message = req.body;
	console.log(message);
	messages.push(message);

	if (messages.length > n) {
		messages = messages.slice(1,messages.length);
	} 

	res.send('Message is added to the database');
});

app.get('/chat', (req, res) => {
	const user = req.query.user;
	const game = req.query.game;
	const userId = req.query.userId;
	const limit = req.query.limit;

	if (user === undefined && game === undefined && userId === undefined) {
		res.send(messages.slice(limit, messages.length));
	} else if (user != undefined && game === undefined && userId === undefined) {
		var response = [];
		for (let i = 0; i < messages.length; i++) {
			if (messages[i].username === user) {
				response.push(messages[i]);
			}
		}
		if(limit == 0 || response.length-limit < 0) {
			res.send(response)
		}else{
			res.send(response.slice(response.length-limit, response.length))
		}
	} else if (user === undefined && game != undefined && userId === undefined) {
		var response = [];
		for (let i = 0; i < messages.length; i++) {
			if (messages[i].game === game) {
				response.push(messages[i]);
			}
		}
		if(limit == 0 || response.length-limit < 0) {
			res.send(response)
		}else{
			res.send(response.slice(response.length-limit, response.length))
		}
	} else if (user === undefined && game === undefined && userId != undefined) {
		var response = [];
		for (let i = 0; i < messages.length; i++) {
			if (messages[i].userId === userId) {
				response.push(messages[i]);
			}
		}
		if(limit == 0 || response.length-limit < 0) {
			res.send(response)
		}else{
			res.send(response.slice(response.length-limit, response.length))
		}
	} else if (user != undefined && game != undefined && userId === undefined) {
		var response = [];
		for (let i = 0; i < messages.length; i++) {
			if (messages[i].username === user && messages[i].game === game) {
				response.push(messages[i]);
			}
		}
		if(limit == 0 || response.length-limit < 0) {
			res.send(response)
		}else{
			res.send(response.slice(response.length-limit, response.length))
		}
	} else if (user === undefined && game != undefined && userId != undefined) {
		var response = [];
		for (let i = 0; i < messages.length; i++) {
			if (messages[i].userId === userId && messages[i].game === game) {
				response.push(messages[i]);
			}
		}
		if(limit == 0 || response.length-limit < 0) {
			res.send(response)
		}else{
			res.send(response.slice(response.length-limit, response.length))
		}
	} else {
    	res.send(messages);
	}

});

app.get('/leaderboard', (req, res) => {
	fs.readFile("[REDACTED]", 'ascii', function (err, file) {
		if (err) throw err;
		let totalData = file.toString().split("\n");
		res.send(totalData)
	});
});

app.post('/leaderboard', (req, res) => {
	const message = req.body;
	const uid = message.player
	const score = message.totalpoints
	fs.readFile("[REDACTED]", 'ascii', function (err, file) {
		if (err) throw err;
		let totalData = file.toString().split("\n");
		for (let i = 0; i < totalData.length; i++) {
			if (totalData[i].length != 0) {
				let dat = totalData[i].split("\r")[0].split("|");

				if (dat[0] === uid) {
					totalData[i] = uid+"|"+score
				}
			}
		}
		console.log(totalData.join("\n"))
		fs.writeFileSync("[REDACTED]", totalData.join("\n"));
	});
	res.send("Done");


});

app.listen(port, () => console.log('Up and Running'));