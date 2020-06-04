require('dotenv').config();
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var portNumber = 5001;
//var code = 0;
var mCodes = new Map();
var mGameTypes = new Map();
const DELETE_INTERVAL = 86400000;  //  One day of milliseconds.  How often to delete old games
const OLD_GAMES = 30;   //  how many days back to delete
const GT_UTTT = 0;
const GT_REVERSI = 1;
const GT_PAGADE = 2;
const MAX_PLAYERS = [2, 2, 4];

server.listen(process.env.PORT || portNumber);
console.log("server is up and running, listening on port: " + portNumber);

/*
//  for database
var pg = require('pg');
//var conString = "postgres://[username]:[password]@[URL]:[port]]/[database name]"
var connectionString = "postgres://" + process.env.DATABASE_USER + ":" + process.env.DATABASE_PASSWORD + "@" + process.env.DATABASE_NAME + ":" + process.env.DATABASE_PORT;   //  AWS testing
var pgClient = new pg.Client(connectionString);
pgClient.connect();
*/

//  ***************************   Create Code   ***************************
function getCode() {
  console.log("\tget Code()");
  let done = true;
  let c = 0;
  do {
    c = Math.floor(Math.random() * Math.floor(10000));
    done = mCodes.has(c);
  }
  while (done)
  let aPlayerInfo = new Array();
  mCodes.set(c, aPlayerInfo);
  console.log("\tleaving get Code()")

  return c;
}

//delete games that are older than OLD_GAMES
//  *****************   Delete Old Games   *****************
function deleteOldGames() {
  let then = new Date();
  then.setDate(then.getDate() - OLD_GAMES);
  let deleteDate = then.getFullYear() + "-" + then.getMonth() + "-" + then.getDay();
  let deleteString = "DELETE FROM games WHERE game_date < \'" + deleteDate + "\';"
  console.log("Delete String: " + deleteString);
  pgClient.query(deleteString)
    .then(res => console.log("Deleted old games"))
    .catch(e => console.error(e.stack))
}
let timerID = setInterval(() => deleteOldGames(), DELETE_INTERVAL);

//  *****************   Log Output Message   *****************
function logOutputMessge(foo, room, socketID) {
  let code = parseInt(room);
  let playerInfo = mCodes.get(code);
  let tmpName = ""
  let tempTypeMap = mGameTypes.get(code);
  let gameType = tempTypeMap.type;
  for (i = 0; i < playerInfo.length; i++)
    if (playerInfo[i].Socket == socketID)
      tmpName = playerInfo[i].name;

  let dt = new Date(new Date().getTime());
  dtFormatted = (dt.getMonth() + 1 + "/" + dt.getDate() + " " + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':' + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()));
  console.log(dtFormatted + " - Function: " + foo + ", From: " + tmpName + ", Room: " + room);
}

function checkCodeExist(room) {
  let now = new Date().getTime();

  code = parseInt(room);
  //  check to see if the code they sent is in mCodes
  let exist = mCodes.has(code);
  if (!exist) {
    socket.emit('err', {
      text: 'That code does not exist, please enter a valid code.',
      time: now
    });
    return false;
  }
  return true;
}
//  ***********************************************************************
//  **************************   On Connection ****************************
//  ***********************************************************************
io.on('connection', function (socket) {
  let dt = new Date(new Date().getTime());
  dtFormatted = (dt.getMonth() + 1 + "/" + dt.getDate() + " " + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':' + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()));
  console.log(dtFormatted + " - on Connection; Socket: "+ socket.id);
  socket.emit('err', {
    text: 'Connected to server',
    time: new Date().getTime()
  });

  //  ***************************   Create Game   ***************************
  socket.on('createGame', function (data) {
    console.log("on create Game");

    code = getCode(); //  get new code
    console.log("\tRoom: " + code + "\t Socket ID: " + socket.id);
    let playerInfo = { Socket: socket.id, name: data.name, player1: true, playerNum: 0 };
    let aPlayerInfo = mCodes.get(code);
    aPlayerInfo.push(playerInfo);   //  put socket id into array associated with that code
    mCodes.set(code, aPlayerInfo);
    mGameTypes.set(code, { type: data.type, start: data.start });
    socket.join(code.toString());

    //  send message back to user
    let now = new Date().getTime();
    let iCount = mCodes.size;
    socket.emit('newGame', {
      name: data.name,
      room: code,
      time: now,
      count: iCount
    });

    console.log("leaving create Game - " + code);
  });

  //  ***************************   Join Game   ***************************
  socket.on('joinGame', function (data) {
    console.log(data.name + " Joined Game - Room: " + data.room + " Socket: " + socket.id);
    let now = new Date().getTime();

    code = parseInt(data.room);

    //  check to see if the code they sent is in mCodes
    if (!checkCodeExist(data.room))
      return;

    let gameType = mGameTypes.get(code).type;
    if (gameType != data.type) {
      socket.emit('err', {
        text: 'That code is for a different type of game.',
        time: now
      });
      return;
    }

    let aPlayerInfo = mCodes.get(code);  //  get the array of sockets associated with the code
    //  check if there are more than two sockets already associated with this code
    if (aPlayerInfo.length == MAX_PLAYERS[gameType]) {
      socket.emit('err', {
        text: 'Sorry, The room is full!',
        time: now
      });
      return;
    }
    let playerInfo = { Socket: socket.id, name: data.name, player1: false, playerNum: data.playNum };
    mCodes.get(code).push(playerInfo);  //  add the new socket to the array

    socket.join(code.toString());
    //console.log(io.nsps['/'].adapter.rooms[code]);
    let msg = data.name + " has joined the game";
    //console.log("broadcasting joined message");
    socket.broadcast.to(code).emit('joined', {
      text: msg,
      time: now,
      nop: aPlayerInfo.length,
      name: data.name,
      playerNumber: data.playNum
    });
    socket.emit('player2', {
      code: code,
      time: now,
      nop: aPlayerInfo.length,
      name: data.name,
      start: mGameTypes.get(code).start
    });

    console.log("leaving Join Game - " + data.room);
  });

  //  ***************************   Message   ***************************
  socket.on('message', function (data) {
    logOutputMessge("Message", data.room, socket.id);

    if (!checkCodeExist(data.room))
      return;

    let now = new Date().getTime();
    socket.emit('message', {
      name: data.name,
      text: data.text,
      color: data.color,
      time: now
    });

    socket.in(data.room).emit('message', {
      name: data.name,
      text: data.text,
      color: data.color,
      time: now
    });
    console.log("leaving Message - " + data.room);
  });

  //  ***************************   Turn   ***************************
  socket.on('turn', function (data) {
    logOutputMessge("Turn", data.room, socket.id);
    console.log("\tMove - id: " + data.id + " MoveType: " + data.moveType);

    if (!checkCodeExist(data.room))
      return;

    //socket.broadcast.to(data.room).emit('message', { name:data.name, text: data.text, color: data.color, time: now});
    //socket.emit('message', {  name:data.name, text: data.text, color: data.color, time: now});
    socket.broadcast.to(data.room).emit('turn', {
      id: data.id,
      dMoveType: data.moveType
    });
    console.log("leaving Turn - " + data.room);
  });

  //  *************************    End Turn   *************************
  socket.on('endTurn', function (data) {
    logOutputMessge("End Turn", data.room, socket.id);

    if (!checkCodeExist(data.room))
      return;

    socket.broadcast.to(data.room).emit('endTurn');
    console.log("leaving End Turn - " + data.room);
  });

  //  ***************************   Play Again   ***************************
  socket.on('playAgain', function (data) {
    logOutputMessge("Play Again", parseInt(data.room), socket.id);

    if (!checkCodeExist(data.room))
      return;

    socket.broadcast.to(data.room).emit('playAgain');
    console.log("leaving Play Again - " + data.room);
  });

  //  ***************************   all players   ***************************
  socket.on('allPlayersNames', function (data) {
    console.log("Start of Sending all players: " + socket.id);

    if (!checkCodeExist(data.room))
      return;

    socket.broadcast.to(data.room).emit('allPlayers', {
      players: data.players
    });
  });

  //  ***************************   player's Cards   ***************************
  socket.on('playersCards', function (data) {
    console.log("Sending player " + data.playerNum + " thier cards");
    console.log("/the dealer is:" + data.theDealer);


    if (!checkCodeExist(data.room))
      return;

    let aPlayerInfo = mCodes.get(code);  //  get the array of sockets associated with the code
    let done = false;
    let i = 0;
    while (!done) {
      playerInfo = aPlayerInfo[i++];
      if (data.playerNum == playerInfo.playerNum) {
        console.log("sending cards to player: " + data.playerNum)
        io.to(playerInfo.Socket).emit('cards', { cards: data.myCards, theDealer:data.theDealer });
        done = true;
      }
    }
  });

  //  ***************************   dealt trump   ***************************
  socket.on('dealtTrump', function (data) {
    console.log("Asking player " + data.playerNum + " if they want the dealt suit as trump");
    console.log("/the suit is:" + data.dealtTrump);

    if (!checkCodeExist(data.room))
      return;

    let aPlayerInfo = mCodes.get(code);  //  get the array of sockets associated with the code
    let done = false;
    let i = 0;
    
    while (!done) {
      playerInfo = aPlayerInfo[i++];
      if (data.playerNum == playerInfo.playerNum) {
        console.log("sending cards to player: " + data.playerNum)
        io.to(playerInfo.Socket).emit('orderDealt', { playerNum:data.playerNum, dealtTrump:data.dealtTrump, type:data.type});
        done = true;
      }
    }
  });

   //  ***********************   dealt trump response  ***********************
   socket.on('dealtTrumpResponse', function (data) {
    console.log("recieved dealt trump reponse: " + socket.id);

    if (!checkCodeExist(data.room))
      return;

    socket.broadcast.to(data.room).emit('dealtTrumpReponse', {
      playerNum: data.playerNum,
      playerGoingAlone: datagoAlone,
      response:data.dealtTrumpResponse
    });

   });

   // ******************   re deal  ***********************
   socket.on('redeal', function (data) {
    console.log("redealing: " + socket.id);

    if (!checkCodeExist(data.room))
      return;

    socket.broadcast.to(data.room).emit('receiveRedeal');

   });

// ******************   trump suit  ***********************
socket.on('trumpsuit', function (data) {
  console.log("trump suit: " + socket.id);

  if (!checkCodeExist(data.room))
    return;

  socket.broadcast.to(data.room).emit('recieveTrumpSuit',{trumpSuit:data.trumpSuit,goAlone:data.isGoingAlone});

 });









  //  ***************************   Save Game   ***************************
  socket.on('save', function (data) {
    logOutputMessge("Save", data.room, socket.id);

    if (undefined == mCodes.get(parseInt(data.room))) {
      let now = new Date().getTime();
      socket.emit('err', {
        text: 'Please start a game before saving',
        time: now
      });
      return;
    }

    let p1Name = mCodes.get(parseInt(data.room))[0].name;
    let p2Name = mCodes.get(parseInt(data.room))[1].name;
    let gameType = mGameTypes.get(data.room).type;


    //await pgClient.connect();
    console.log("Saving Game");
    let moves = data.moves;
    let movesArray = new Array();
    let playersArray = new Array();
    for (i = 0; i < moves.length; i++) {
      movesArray[i] = moves[i].id;
      playersArray[i] = moves[i].player;
    }

    let existString = "select exists(select 1 from games where room_id= " + data.room + ");";
    pgClient.query(existString, (err, res) => {
      if (err) {
        console.log(err.stack)
      } else {
        console.log("callback: " + res.rows[0].exists)
        let queryString = "";
        if (res.rows[0].exists) {
          console.log("\tCode already exist,  Need to UPDATE");
          queryString = "UPDATE games SET moves_id= ARRAY[" + movesArray + "],moves_player=ARRAY[" + playersArray + "] WHERE room_id=" + data.room + ";"
        }
        else {
          console.log("\tCode DOESN'T exist,  Need to INSERT");
          queryString = "INSERT INTO games(game_date, room_id,moves_id,moves_player,p1_name,p2_name, type) VALUES(CURRENT_DATE," + data.room + ",ARRAY[" + movesArray + "],ARRAY[" + playersArray + "], '" + p1Name + "', '" + p2Name + "', " + gameType + ");"
        }
        pgClient.query(queryString, (err, res) => {
          if (err) {
            console.log("ERROR Updating / Saving game - Query String: " + queryString + "\nError String: " + err.stack)
          } else {
            console.log("\tRecord was updates/saved Successfully")
            let now = new Date().getTime();
            socket.emit('saved', { time: now });  // send a message to the socket on which it was called
            socket.in(data.room.toString()).emit('saved', { time: now }); // sends message to all sockets in the given room  (not working like I think it should)
          }  //  end of update / save
        })
      }  //  end of exist
    })

    console.log("leaving Save  - " + data.room);
  }); //  end save

  //  *****************   success load   *****************
  function successLoadData(result, isP1, gType) {
    console.log("In successLoadData");

    if (undefined == result.rows[0]) {
      let now = new Date().getTime();
      socket.emit('err', {
        text: 'Please enter a valid code',
        time: now
      });
      return;
    }

    let p1 = result.rows[0].p1_name;
    let p2 = result.rows[0].p2_name;
    let code = result.rows[0].room_id;
    let aMoves = result.rows[0].moves_id;
    let aPlayerMoves = result.rows[0].moves_player;
    let gameType = result.rows[0].type;
    if (gameType != gType) {
      let now = new Date().getTime();
      socket.emit('err', {
        text: 'Please enter a valid code, this code is for a different game type.',
        time: now
      });
      return;
    }

    mGameTypes.set(code, { type: gameType, start: 0 });

    let gameData = new Array();
    for (i = 0; i < aMoves.length; i++) {
      let player = aPlayerMoves[i];
      let move = aMoves[i];
      gameData[i] = { player, move };
      console.log("\tPlayer: " + player + " move: " + move)
    }

    //  determine if this is the first person to load game, or second
    let aPlayerInfo = mCodes.get(parseInt(code));
    let playerInfo = "";
    if (undefined == aPlayerInfo) {  //  the first time loading this game
      aPlayerInfo = new Array();
      playerInfo = { Socket: socket.id, name: p1, player1: isP1 };
      aPlayerInfo.push(playerInfo);
      mCodes.set(parseInt(code), aPlayerInfo);
    }
    else {  //second time loading this game
      let currentPlayerInfo = mCodes.get(code);
      let now = new Date().getTime();
      if (currentPlayerInfo[0].player1 == true && isP1) {  //  check if we already have a player1
        socket.emit('err', {
          text: 'the other player has already loaded the game as the player 1',
          time: now
        });
        return;
      }
      playerInfo = { Socket: socket.id, name: p2, replayer1d: isP1 };
      aPlayerInfo.push(playerInfo);
      mCodes.set(parseInt(code), aPlayerInfo);
      //  send message to first play that I have joined
      let tmpColor = "";
      if (isP1)
        tmpColor = "Player1"
      else
        tmpColor = "Player2";
      socket.in(code).emit('message', {
        name: "SERVER",
        text: p2 + " has joined the game",
        color: tmpColor,
        time: now
      });
    }//  end of second time this has been called
    socket.join(code.toString());

    let playerName = "";
    if (isP1)
      playerName = p1;
    else
      playerName = p2;

    socket.emit('load', {
      game: gameData,
      player1: isP1,
      name: playerName
    });
    console.log("leaving successLoadData");

  }  //  end of successLoadData

  //  *************   failure to  load   *****************
  function failureLoadData(error) {
    console.error("Error retrieving data from database: " + error.stack);
    socket.emit('err', {
      text: 'Something went wrong loading the game from the database',
      time: now
    });
  }

  //  ***************************   Load   ***************************
  socket.on('load', function (data) {
    let code = parseInt(data.room);
    console.log("Load function,  Room: " + code + " Socket: " + socket.id);
    mGameTypes.set(code, { type: -1, start: 0 });

    let selectString = "SELECT room_id, p1_name, p2_name, moves_id, moves_player, type FROM games WHERE room_id = " + data.room + " ;"
    pgClient.query(selectString)
      .then(result => successLoadData(result, data.player1, data.type))
      .catch(e => failureLoadData(e))

    console.log("leaving Load - " + data.room);
  }); //  end load

  //  ************   Log Map Elements   ************
  function logMapElements(value, key, map) {
    console.log(`m[${key}] = ${value}`);
  }
  //  ***************************   Close   ***************************
  socket.on('close', function (data) {
    console.log("on Close - Room: " + data.room + " Socket: " + socket.id);
    let code = parseInt(data.room)

    if (!mCodes.has(code))
      return;

    //  send a message to your opponent that you left
    let now = new Date().getTime();
    socket.in(code).emit('message', {
      name: "SERVER",
      text: "Your opponent has left the game",
      color: "black",
      time: now
    });

    //  remove the room from mCodes and disconnect all associated sockets
    let aPlayerInfo = mCodes.get(code);
    for (x = 0; x < aPlayerInfo.length; x++) {
      if (io.sockets.sockets[aPlayerInfo[x].Socket] != undefined)
        io.sockets.connected[aPlayerInfo[x].Socket].disconnect();
    }
    mCodes.delete(code);
    mGameTypes.delete(code);
    //        console.log("Codes AFTER delete: ");
    //        mCodes.forEach(logMapElements);

    console.log("leaving Close - " + data.room);
  });
}) //  end io.on  connection
