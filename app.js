const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
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
let currentplayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.render("homepage");
});
app.get("/play", function (req, res) {
  res.render("index");
});

app.get("/custom", function (req, res) {
  res.render("custom");
});

io.on("connection", function (uniquesocket) {
  console.log("connected");

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  if (players.white && players.black) {
    initTimers(io);
    startTimer(chess.turn());
  }

  uniquesocket.on("disconnect", function () {
    if (uniquesocket.id === players.white) {
      delete players.white;
      console.log("white disconnected");
      io.emit("gameOver", "White disconnected. Black wins!");
      chess.reset();
      players = {};
      resetTimers(io);
    } else if (uniquesocket.id === players.black) {
      delete players.black;
      console.log("black disconnected");
      io.emit("gameOver", "Black disconnected. White wins!");
      chess.reset();
      players = {};
      resetTimers(io);
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      // white kai time pai white chal payega aur black kai time pai black chal payega
      if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
      if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentplayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());

        if (chess.game_over()) {
          stopTimer("w");
          stopTimer("b");
          let gameOverMessage = "";
          if (chess.in_checkmate()) {
            gameOverMessage = `Checkmate! ${
              chess.turn() === "w" ? "Black" : "White"
            } wins!`;
          } else if (chess.in_draw()) {
            gameOverMessage = "Game ended in a draw!";
          }
          io.emit("gameOver", gameOverMessage);
          console.log("game is over", gameOverMessage);
        } else if (chess.in_check()) {
          startTimer(chess.turn(), io);
          stopTimer(chess.turn() === "w" ? "b" : "w");
          io.emit("inCheck", chess.turn());
        } else {
          startTimer(chess.turn(), io);
          stopTimer(chess.turn() === "w" ? "b" : "w");
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
