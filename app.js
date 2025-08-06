require("dotenv").config();

const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const {
  clerkMiddleware,
  requireAuth,
  clerkClient,
  getAuth,
} = require("@clerk/express");
const { v4: uuidv4 } = require("uuid");
const {
  initTimers,
  startTimer,
  stopTimer,
  resetTimers,
  getTimers,
} = require("./public/js/timer");
const { url } = require("inspector");
const { name } = require("ejs");

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

const games = new Map();
const playerRooms = new Map();

let currentplayer = "w";

const matchmakingQueue = [];

app.use(clerkMiddleware());

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async function (req, res) {
  const { userId } = getAuth(req);
  let user = null;

  // Only try to get user data if userId exists
  if (userId) {
    try {
      user = await clerkClient.users.getUser(userId);
    } catch (error) {
      console.error("Error fetching user:", error);
      // user remains null if there's an error
    }
  }

  res.render("homepage", { user });
});

app.get("/searching", async function (req, res) {
  const { userId } = getAuth(req);
  const roomId = req.params.roomId;
  const color = req.query.color;
  let user = null;

  if (userId) {
    try {
      user = await clerkClient.users.getUser(userId);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }

  res.render("searching", {
    user: user,
    roomId: roomId,
    assignedColor: color || null,
  });
});

app.get(
  "/play",
  requireAuth({ signInUrl: "/sign-in" }),
  async function (req, res) {
    const { userId } = getAuth(req);
    let user = null;

    if (userId) {
      try {
        user = await clerkClient.users.getUser(userId);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
    const roomId = null;

    res.render("index", { user, roomId, assignedColor: null });
  }
);

app.get("/sign-in", (req, res) => {
  res.render("sign-in");
});

app.get("/createlink", (req, res) => {
  const roomId = uuidv4();
  console.log("Room created with ID:", roomId);
  res.redirect(`/play/${roomId}`);
});

app.get(
  "/play/:roomId",
  requireAuth({ signInUrl: "/sign-in" }),
  async function (req, res) {
    const { userId } = getAuth(req);
    const roomId = req.params.roomId;
    const color = req.query.color;
    let user = null;

    if (userId) {
      try {
        user = await clerkClient.users.getUser(userId);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }

    res.render("index", {
      user: user,
      roomId: roomId,
      assignedColor: color || null,
    });
  }
);

app.get("/custom", function (req, res) {
  res.render("custom");
});

io.on("connection", function (uniquesocket) {
  console.log("A user connected:", uniquesocket.id);
  console.log("Connected");
  // console.log("Socket ID:", uniquesocket);
  const roomId = uniquesocket.handshake.query.roomId;
  const userId = uniquesocket.handshake.query.userId;
  const userName = uniquesocket.handshake.query.userName;
  const email = uniquesocket.handshake.query.email;

  console.log("User data from connection:", {
    roomId,
    userId,
    userName,
    email,
  });

  if (!roomId) {
    roomId == uuidv4();
  }

  uniquesocket.userData = {
    userId,
    userName,
    email,
  };

  uniquesocket.join(roomId);

  playerRooms.set(uniquesocket.id, roomId);

  if (!games.has(roomId)) {
    games.set(roomId, {
      chess: new Chess(),
      players: {},
      currentplayer: "w",
      playerProfiles: {
        white: null,
        black: null,
      },
    });
  }

  const game = games.get(roomId);

  if (!game.players.white) {
    game.players.white = uniquesocket.id;
    game.playerProfiles.white = uniquesocket.userData;
    uniquesocket.emit("playerRole", "w");

    io.to(roomId).emit("playerJoined", {
      color: "white",
      name: uniquesocket.userData.userName,
      userId: uniquesocket.userData.userId,
    });
  } else if (!game.players.black) {
    game.players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");

    io.to(roomId).emit("playerJoined", {
      color: "black",
      name: uniquesocket.userData.userName,
      userId: uniquesocket.userData.userId,
    });
  } else {
    uniquesocket.emit("spectatorRole");
  }

  if (
    game.players.white &&
    game.playerProfiles.white &&
    uniquesocket.id === game.players.black
  ) {
    uniquesocket.emit("playerJoined", {
      color: "white",
      name: game.playerProfiles.white.userName,
      userId: game.playerProfiles.white.userId,
    });
  }

  if (
    game.players.black &&
    game.playerProfiles.black &&
    uniquesocket.id === game.players.white
  ) {
    uniquesocket.emit("playerJoined", {
      color: "black",
      name: game.playerProfiles.black.userName,
      userId: game.playerProfiles.black.userId,
    });
  }

  if (game.players.white && game.players.black) {
    initTimers(io.to(roomId));
    startTimer(game.chess.turn(), io.to(roomId));
  }

  uniquesocket.on("joinMatchmaking", function (userData) {
    const { userId, userName, email } = userData;

    if (!userId || !userName) {
      uniquesocket.emit(
        "matchmakingerror",
        "User ID and name are required to join matchmaking."
      );
      return;
    }

    console.log(
      `User email:${email}  ${userName} (${userId})  joined matchmaking queue`
    );

    if (matchmakingQueue.length > 0) {
      const waitingPlayer = matchmakingQueue.shift();
      console.log("This is waiting player:", waitingPlayer);

      const roomId = `match_${waitingPlayer.userId.slice(0, 4)}_${userId.slice(
        0,
        4
      )}_${Date.now()}`;

      const isWhite = Math.random() >= 0.5 ? "white" : "black";

      uniquesocket.emit("matchFound", {
        roomId: roomId,
        color: isWhite ? "w" : "b",
        opponent: {
          name: waitingPlayer.userName,
          id: waitingPlayer.userId,
        },
      });

      waitingPlayer.socket.emit("matchFound", {
        roomId: roomId,
        color: isWhite ? "b" : "w",
        opponent: {
          name: userName,
          id: userId,
        },
      });
    } else {
      matchmakingQueue.push({
        userId: userId,
        userName: userName,
        socket: uniquesocket,
      });

      uniquesocket.emit("waitingForMatch", {
        message: "Looking for an opponent...",
        queuePosition: matchmakingQueue.length,
      });
    }

    uniquesocket.emit("waitingForMatch", {
      message: "Looking for an opponent...",
      queuePosition: matchmakingQueue.length,
    });

    uniquesocket.matchmakingQueue = {
      userId: userId,
      userName: userName,
      isInQueue: true,
    };
  });

  uniquesocket.on("leaveMatchmaking", function () {
    removeFromQueue(uniquesocket);
    uniquesocket.emit("leftMatchmaking", {
      message: "You have left the matchmaking queue",
    });
  });

  uniquesocket.on("disconnect", function () {
    removeFromQueue(uniquesocket);
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
    io.to(roomId).emit("timerUpdate", getTimers());
  });

  // Add inside your io.on("connection") function
  uniquesocket.on("requestColor", function (preferredColor) {
    const roomId = playerRooms.get(uniquesocket.id);
    if (!roomId || !games.has(roomId)) return;

    const game = games.get(roomId);

    // Only honor color requests if positions are available
    if (preferredColor === "w" && !game.players.white) {
      game.players.white = uniquesocket.id;
      game.playerProfiles.white = uniquesocket.userData;
      uniquesocket.emit("playerRole", "w");
      uniquesocket.emit("forceColor", "w");

      io.to(roomId).emit("playerJoined", {
        color: "white",
        name: uniquesocket.userData.userName,
        userId: uniquesocket.userData.userId,
      });
    } else if (preferredColor === "b" && !game.players.black) {
      game.players.black = uniquesocket.id;
      game.playerProfiles.black = uniquesocket.userData;
      uniquesocket.emit("playerRole", "b");
      uniquesocket.emit("forceColor", "b");

      io.to(roomId).emit("playerJoined", {
        color: "black",
        name: uniquesocket.userData.userName,
        userId: uniquesocket.userData.userId,
      });
    }
  });
});

function removeFromQueue(socket) {
  const index = matchmakingQueue.findIndex(
    (player) => player.socket.id === socket.id
  );
  if (index !== -1) {
    const player = matchmakingQueue[index];
    console.log(`Removing ${player.userName} from matchmaking queue`);
    matchmakingQueue.splice(index, 1);
    return true;
  }
  return false;
}

server.listen(3000);
