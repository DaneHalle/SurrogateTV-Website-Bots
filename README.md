# SurrogateTV-Website-Bots
In my work with SurrogateTV, I have developed and made a number of bots that interface with the actual site for different purposes. Most of these run on personal Raspberry Pis utilizing pm2. 

Some values were redacted.

##`chatlog.js`
A chat listener that listens to all the chats in the given file. That file should be formated as follows:
```
gameUUID|shortID
...
```
(See [https://github.com/DaneHalle/SurrogateTV-API-Crawlers](https://github.com/DaneHalle/SurrogateTV-API-Crawlers))

Will also push to a REST server of your choice (see `rest.js` section). 

##`rest.js`
A REST server to work in tandem with `chatlog.js`. Has a `/chat` section and a `/leaderboard` section. The `/leaderboard` section is utilized by me for information on my current running game on the site. The `/chat` section is used to keep a running log of the last 100 chat messages seen by `chatlog.js` and can be viewed while on my local network. 

##`descriptionTest.js`
Given a user who has admin access to a game page (give email and pass in the code), a user can update the description of a given game page through the chat. 

This was just a test example to show that it could be done automatically. 

##`toggleTest.js`
Given a user who has admin access to a game page (give email and pass in the code), a user can turn a game page on or off by talking in the game chat. 

This was just a text example to show that it could be done. It also has an "echo" functionallity where it repeats whatever is said when you say `!test ...` in the chat. 

##`autoTurnOnOff.js`
Given a user who has admin access to a game page (give email and pass in the code), this will automatically turn off or on the game given the game's schedule. It also allows some further functionallity controlled through the game chat.

This was made for switch3's game, startrek. It can be easily modified to be utilized on other games by changing values. 

##`arcade.js`
Given a user who has admin access to a game page (give email and pass in the code), this will register "wins" by the game and will turn off the game after a certain threshold is met. That threshold can be set in the game chat. 

This was made for ArcadeMatt's game, arcadematt. It can be easily modified to be utilized on other games by changing values. 
