var express = require('express');
var exphbs  = require('express-handlebars');
var cradle = require('cradle');
var db = new(cradle.Connection)('http://mafia.sockdrawer.io:5984').database('games');

var app = express();

var hbs = exphbs.create({
    defaultLayout: "main",
    // Specify helpers which are only registered on this instance.
    helpers: {
        gamePanelClass: (winner) => {
            if (winner === 'town') return 'panel-success';
            if (winner === 'scum') return 'panel-danger';
            if (winner === 'scum2') return 'panel-danger';
            if (winner === '3party') return 'panel-warning';
            if (winner === 'cult') return 'panel-warning';
            return 'panel-info';
        },
        collapseList: (arr) => {
            if (typeof arr === 'object') {
                arr = Object.keys(arr);
            }
            if (arr.length == 0) return "";
            if (arr.length == 1) return arr[0];
            if (arr.length == 2) return arr[0] + "&" + arr[1];
            return arr.reduce((string, val, index) => {
                if (index == 0) return val;
                if (index != arr.length-1) return string + ", " + val;
                return string + ", and " + val;
            });
        },
        getRole: (player) => {
          if (player.properties.indexOf('scum') > -1) return "Scum";
          if (player.properties.indexOf('3party') > -1) return "3rd Party";
          if (player.properties.indexOf('cult') > -1) {
              if (player.properties.indexOf('cult-leader') > -1) return "Cult Leader";
              return "Cult Recruit";
          }
          return "Town";
        },
        getWinner: (win) => {
            if (!win) return "Unknown";
            if (win === 'town') return "Town";
            if (win === 'scum') return "Scum";
            if (win === 'scum2') return "Second Scum";
            if (win === '3party') return "Third Party";
            if (win === 'cult') return "Cult";
            return win;
        },
        makeActionPast: (action) => {
            if (action === "vote") return "voted for";
            return action + 'ed';
        }
    }
});


app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/games', function (req, res) {
    db.view('games/listGames', function (err, games) {
        res.render('gamesList', {
            games: games
        });
    });
});

app.get('/games/:id', function (req, res) {
    db.get(req.params.id, function (err, game) {
        res.render('gameView', game);
    });
});

app.get('/players', function (req, res) {
    db.view('games/byPlayer',  {group: true, reduce: true}, function (err, players) {
        res.render('playerList', {
            count: players.length,
            players: players
        });
    });
});

app.get('/players/:id', function (req, res) {
    db.view('games/byPlayer', {group: false, reduce: false, 'key': req.params.id}, function (err, games) {
        let numGames = games.length;
        let numWins = games.reduce((sum, item) => {
            return (item.value.won ? sum + 1 : sum)
        }, 0);
        console.log(games)

        res.render('playerView', {
            wins: numWins,
            numGames: numGames,
            percent: numWins / numGames * 100,
            key: games[0].key,
            name: games[0].value.username,
            games: games
        });
    });
});


app.listen(process.env.PORT);