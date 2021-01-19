const Kahoot = require("kahoot.js-updated");
var express = require('express');
var flatted = require('flatted');
var fs = require('fs')
var games = [];
var logging = true // set to false to disable logs
var app = express()
var port = 5500

//kahoot function. Handles all gameplay

function joingame(pin, bot_name, bot_count) {
    var gameid = games.length;
    games.push({
        pin: pin,
        name: bot_name,
        bot_count: bot_count,
        bots: [],
        deadbots: []
    });
    for (var i = 0; i < bot_count; i++) {
        games[gameid].bots.push(new Kahoot)
        games[gameid].bots[i].join(pin, bot_name + String(i)).catch(error => {
            if (logging) {
                console.log("join failed " + error.description + " " + error.status)
            }
        });
        games[gameid].bots[i].on("Joined", () => {
            if (logging) {
                console.log("successfully joined game")
            }
        });
        games[gameid].bots[i].on("QuestionStart", (question) => {
            question.answer(
                Math.floor(
                    (Math.random() * question.quizQuestionAnswers[question.questionIndex]) + 0));
        });
        games[gameid].bots[i].on("Disconnect", (reason) => {
            if (logging) {
                console.log("disconnected because " + reason)
            }
            if (games[gameid] != null) {
                games[gameid].deadbots.push(i)

                if (games[gameid].deadbots.length > 8) {
                    for (ii in games[gameid].bots) {
                        games[gameid].bots[ii].leave();
                    }
                    if (logging) {
                        console.log("leaving game")
                    }
                    games.splice(gameid, 1)
                }
            }
        });
    }
}
//express stuff
app.get("/endpoint/:pin/:amount/:name", function (request, response) {
    if (logging) {
        console.log("PIN: " + request.params.pin)
        console.log("amount: " + request.params.amount)
        console.log("bot name: " + request.params.name)
    }
    if (Number(request.params.amount) <= 150) {
        joingame(request.params.pin, request.params.name, Number(request.params.amount))

        response.writeHead(200, {
            "content-type": "application/json",
            'cache-control': 'no-cache',
            'access-control-allow-origin': '*',
            'connection': 'keep-alive'
        });
        response.write(`
{
    "success":true
}
`)
        response.end()
    }
    else {
        response.writeHead(200, {
            "content-type": "application/json",
            'cache-control': 'no-cache',
            'access-control-allow-origin': '*',
            'connection': 'keep-alive'
        });
        response.write(`
{
    "success":false
}
`)
        response.end()
    }
});
//list all games
app.get("/gameslist", function (request, response) {
    response.writeHead(200, {
        "content-type": "application/json",
        'cache-control': 'no-cache',
        'access-control-allow-origin': '*',
        'connection': 'keep-alive'
    });
    response.write(flatted.stringify(games))
    response.end()
});

app.get("/bot_count",function(request,response){
    response.writeHead(200, {
        "content-type": "application/json",
        'cache-control': 'no-cache',
        'access-control-allow-origin': '*',
        'connection': 'keep-alive'
    });
    var res = {
        game_count: games.length
    }
    response.write(JSON.stringify(res))
    response.end()
})

app.get("/:page", function (request, response) {
    if (fs.existsSync(request.params.page)) {
        fs.createReadStream(request.params.page).pipe(response);
    }
    else {

        fs.createReadStream("404.html").pipe(response);
    }
})
app.get("/", function (request, response) {
    fs.createReadStream("index.html").pipe(response);
})
app.listen(port);