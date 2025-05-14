const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const whiteTimer = document.querySelector(".timer2");
const blackTimer = document.querySelector(".timer1");
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let timerFlipped = false;
const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowindex + squareindex) % 2 === 0 ? "Light" : "dark"
      );

      squareElement.dataset.row = rowindex;
      squareElement.dataset.col = squareindex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowindex, col: squareindex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSource = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };

          handleMove(sourceSquare, targetSource);
        }
      });
      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

const renderResult = () => {
  if (chess.game_over()) {
    console.log("Game Over");
    let message = "";
    if (chess.in_checkmate()) {
      message = `Checkmate! ${chess.turn() === "w" ? "Black" : "white"} wins!`;
    } else if (chess.in_draw()) {
      if (chess.in_stalemate()) {
        message = "Game over - Stalemate!";
      } else if (chess.in_threefold_repetition()) {
        message = "Game over - Threefold Repetition!";
      } else if (chess.insufficient_material()) {
        message = "Game over - Draw by Insufficient Material!";
      } else {
        message = "Game over - Draw!";
      }
    }

    displayGameMessage(message);
  }
};

socket.on("inCheck", function (color) {
  if (color === playerRole) {
    displayGameMessage("You are in check!");
  } else {
    displayGameMessage("Your Opponent is in check!");
  }
});

const displayGameMessage = (message) => {
  messageElement = document.createElement("div");
  messageElement.classList.add("game-message");
  messageElement.id = "game-message";
  messageElement.style.cssText =
    "position: absolute; top: 10px; left: 50%; transform: translateX(-50%); font-size: 24px; color: red; z-index: 1000; background-color: rgba(255, 255, 255, 0.8); padding: 10px;";
  document.body.appendChild(messageElement);
  messageElement.textContent = message;
};

const disableDrag = () => {
  const squares = document.querySelectorAll(".square");
  squares.forEach((square) => {
    const piece = square.querySelector(".piece");
    if (piece) {
      piece.draggable = false;
    }
  });
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };

  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♙",
    r: "♖",
    n: "♘",
    b: "♗",
    q: "♕",
    k: "♔",
    P: "♟",
    R: "♜",
    N: "♞",
    B: "♝",
    Q: "♛",
    K: "♔",
  };

  return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function (role) {
  playerRole = role;

  timerFlipped = role === "b";

  renderBoard();
});

socket.on("spectatorRole", function () {
  playerRole = null;
  timerFlipped = false;
  renderBoard();
});

socket.on("boardState", function (fen) {
  chess.load(fen);
  renderBoard();
});

socket.on("move", function (move) {
  chess.move(move);
  renderBoard();
  renderResult();

  if (!chess.in_check()) {
    clearGameMessage();
  }
});

socket.on("timerUpdate", function (timers) {
  if (timerFlipped) {
    whiteTimer.textContent = `White: ${formatTime(timers.w)}`;
    blackTimer.textContent = `Black: ${formatTime(timers.b)}`;
  } else {
    blackTimer.textContent = `Black: ${formatTime(timers.b)}`;
    whiteTimer.textContent = `White: ${formatTime(timers.w)}`;
  }
});

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

const clearGameMessage = () => {
  const messageElement = document.getElementById("game-message");
  if (messageElement) {
    messageElement.remove();
  }
};

socket.on("gameOver", function (message) {
  displayGameMessage(message);
  disableDrag();
});

renderBoard();
