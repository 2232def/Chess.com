const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {
  initTimers,
  startTimer,
  stopTimer,
  resetTimers,
  getTimers,
} = require("./public/js/timer");

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

const games = new Map();
const playerRooms = new Map();

let currentplayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.render("homepage");
});
app.get("/play", function (req, res) {
  res.render("index");
});

app.get("/createlink", (req, res) => {
  const roomId = uuidv4();
  console.log("Room created with ID:", roomId);
  res.redirect(`/play/${roomId}`);
});

app.get("/play/:roomId", function (req, res) {
  const roomId = req.params.roomId;
  res.render("index", { roomId: roomId });
});

app.get("/custom", function (req, res) {
  res.render("custom");
});

io.on("connection", function (uniquesocket) {
  console.log("Connected");
  let roomId = uniquesocket.handshake.query.roomId;
  console.log("A user connected with roomId:", roomId);
  // console.log("Socket ID:", uniquesocket);

  if (!roomId) {
    roomId = uuidv4();
  }

  uniquesocket.join(roomId);

  playerRooms.set(uniquesocket.id, roomId);

  if (!games.has(roomId)) {
    games.set(roomId, {
      chess: new Chess(),
      players: {},
      currentplayer: "w",
    });
  }

  const game = games.get(roomId);

  if (!game.players.white) {
    game.players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!game.players.black) {
    game.players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  if (game.players.white && game.players.black) {
    initTimers(io.to(roomId));
    startTimer(game.chess.turn(), io.to(roomId));
  }

  uniquesocket.on("disconnect", function () {
    const roomId = playerRooms.get(uniquesocket.id);
    if (!roomId || !games.has(roomId)) return;

    const game = games.get(roomId);

    if (uniquesocket.id === game.players.white) {
      delete game.players.white;
      console.log("white disconnected");
      io.to(roomId).emit("gameOver", "White disconnected. Black wins!");
      game.chess.reset();
      game.players = {};
      resetTimers(io);
    } else if (uniquesocket.id === game.players.black) {
      delete game.players.black;
      console.log("black disconnected");
      io.to(roomId).emit("gameOver", "Black disconnected. White wins!");
      game.chess.reset();
      game.players = {};
      resetTimers(io);
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      const roomId = playerRooms.get(uniquesocket.id);
      if (!roomId || !games.has(roomId)) return;

      const game = games.get(roomId);
      // white kai time pai white chal payega aur black kai time pai black chal payega
      if (game.chess.turn() === "w" && uniquesocket.id !== game.players.white)
        return;
      if (game.chess.turn() === "b" && uniquesocket.id !== game.players.black)
        return;

      const result = game.chess.move(move);
      if (result) {
        game.currentplayer = game.chess.turn();
        // io.emit("move", move);
        // io.emit("boardState", game.chess.fen());

        io.to(roomId).emit("move", move);
        io.to(roomId).emit("boardState", game.chess.fen());

        if (game.chess.game_over()) {
          stopTimer("w");
          stopTimer("b");
          let gameOverMessage = "";
          if (game.chess.in_checkmate()) {
            gameOverMessage = `Checkmate! ${
              game.chess.turn() === "w" ? "Black" : "White"
            } wins!`;
          } else if (game.chess.in_draw()) {
            gameOverMessage = "Game ended in a draw!";
          }
          io.to(roomId).emit("gameOver", gameOverMessage);
          console.log(`Game over in room ${roomId}: ${gameOverMessage}`);
        } else if (game.chess.in_check()) {
          startTimer(game.chess.turn(), io.to(roomId));
          stopTimer(game.chess.turn() === "w" ? "b" : "w");
          io.to(roomId).emit("inCheck", game.chess.turn());
        } else {
          startTimer(game.chess.turn(), io.to(roomId));
          stopTimer(game.chess.turn() === "w" ? "b" : "w");
        }
      } else {
        console.log("Invalid move : ", move);
        uniquesocket.emit("invalidMove", move);
      }
    } catch (err) {
      console.log(err);
      uniquesocket.emit("Invalid move : ", move);
    }
  });

  uniquesocket.on("getTimers", () => {
    io.emit("timerUpdate", getTimers());
  });
});

server.listen(3000);
