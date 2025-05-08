const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentplayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.render("index");
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

  uniquesocket.on("disconnect", function () {
    if (uniquesocket.id === players.white) {
      delete players.white;
      console.log("white disconnected");
    } else if (uniquesocket.id === players.black) {
      delete players.black;
      console.log("black disconnected");
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
          let gameOverMessage = "";
          if (chess.in_checkmate()) {
            gameOverMessage = `Checkmate! ${
              chess.turn() === "w" ? "Black" : "White"
            } wins!`;
          } else if (chess.in_draw()) {
            gameOverMessage = "Game ended in a draw!";
          }
          io.emit("gameOver", gameOverMessage);
        } else if (chess.in_check()) {
          io.emit("inCheck", chess.turn());
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
});

server.listen(3000);
