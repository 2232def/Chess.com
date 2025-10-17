const socket = window.socket;
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
let whiteTimer = document.createElement("div");
whiteTimer.classList.add("timer1");
let blackTimer = document.createElement("div");
blackTimer.classList.add("timer2");

whiteTimer.innerHTML = "White: 5:00";
blackTimer.innerHTML = "Black: 5:00";

document.body.appendChild(whiteTimer);
document.body.appendChild(blackTimer);

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let timerFlipped = false;

const preferredColor = socket.io.opts.query.preferredColor || null;

let opponentName = null;
let opponentId = null;
let opponentColor = null;

if (preferredColor) {
  socket.emit("requestColor", preferredColor);
}

socket.on("forceColor", function (color) {
  playerRole = color;
  renderBoard();
});

socket.on("playerJoined", function (data) {
  const isOpponent =
    (playerRole === "w" && data.color === "black") ||
    (playerRole === "b" && data.color === "white");

  if (isOpponent) {
    opponentName = data.name;
    opponentId = data.userId;
    opponentColor = data.color;

    const opponentNameE1 = document.getElementById("opponentName");
    const opponentRoleEl = document.getElementById("opponentRole");

    if (opponentNameE1) {
      opponentNameE1.textContent = opponentName || "Anonymous";
    }

    if (opponentRoleEl) {
      opponentRoleEl.textContent = data.color === "white" ? "White" : "Black";
    }

    const opponentAvatar = document.querySelector(".player1 .square");
    if (opponentAvatar) {
      const firstLetter = opponentName
        ? opponentName.charAt(0).toUpperCase()
        : "?";
      opponentAvatar.innerHTML = `<div class="h-full w-full flex items-center justify-center font-bold text-black">${firstLetter}</div>`;
    }
  }

  if (data.userId === socket.io.opts.query.userId) {
    document.getElementById("userRole").textContent =
      data.color === "white" ? "White" : "Black";
  }
});

function getHumanColor() {
  const compColor =
    window.stockfishService?.getComputerConfiguration?.().color || "black";
  return compColor === "black" ? "w" : "b";
}

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  const humanColor = getHumanColor();
  board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
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
        pieceElement.draggable = window.IS_COMPUTER_MODE
          ? square.color === humanColor
          : playerRole === square.color;

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
          // Clear all hover classes when drag ends
          clearHoverClasses();
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", function (e) {
        e.preventDefault();

        if (!draggedPiece || !sourceSquare) return;
        clearHoverClasses();
        const targetSquare = {
          row: parseInt(squareElement.dataset.row),
          col: parseInt(squareElement.dataset.col),
        };

        const move = {
          from: `${String.fromCharCode(97 + sourceSquare.col)}${
            8 - sourceSquare.row
          }`,
          to: `${String.fromCharCode(97 + targetSquare.col)}${
            8 - targetSquare.row
          }`,
          promotion: "q",
        };
        const testChess = new Chess(chess.fen());

        try {
          const testMove = testChess.move(move);

          if (testMove) {

            squareElement.classList.add("square-hover-legal");
          } else {

            squareElement.classList.add("square-hover-illegal");
          }
        } catch (error) {

          squareElement.classList.add("square-hover-illegal");
        }

        // const from = `${String.fromCharCode(97 + sourceSquare.col)}${
        //   8 - sourceSquare.row
        // }`;
        // const to = `${String.fromCharCode(97 + targetSquare.col)}${
        //   8 - targetSquare.row
        // }`;

        // const testChess = new Chess(chess.fen());

        // try {
        //   const testMove = testChess.move({
        //     from: from,
        //     to: to,
        //     promotion: "q",
        //   });

        //   if (testMove) {
        //     // Valid move - highlight green
        //     squareElement.classList.add("square-hover-legal");
        //   } else {
        //     // Invalid move - highlight red
        //     squareElement.classList.add("square-hover-illegal");
        //   }
        // } catch (error) {
        //   // Invalid move - highlight red
        //   squareElement.classList.add("square-hover-illegal");
        // }
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

  const clearHoverClasses = () => {
    const squares = document.querySelectorAll(".square");
    squares.forEach((square) => {
      square.classList.remove("square-hover-legal", "square-hover-illegal");
    });
  };

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

const renderResult = () => {
  if (chess.game_over()) {
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

function publishBoardUpdate() {
  const fen = chess.fen();
  // const turnChar = fen.split(" ")[1];
  // console.log("FEN:", fen);
  // console.log("FEN:",turnChar);
  document.dispatchEvent(new CustomEvent("board:fen", { detail: { fen } }));
}


window.chesss = chess;

window.renderBoard = renderBoard;
window.publishBoardUpdate = publishBoardUpdate;

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

  if (window.IS_COMPUTER_MODE) {
    const result = chess.move(move);
    if (result) {
      renderBoard();
      if (typeof publishBoardUpdate === "function") publishBoardUpdate();
      if (typeof highlightActiveTimer === "function")
        highlightActiveTimer(chess.turn());
    } else {
      console.warn("Invalid move attempted:", move);
    }
    return;
  }

  if (window.IS_GAME_OVER) {
    console.warn("Game is over; no more moves allowed.");
    return;
  }

  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♙",
    r: "♖",
    n: "♘",
    b: "♗",
    q: "♕",
    k: "♚",
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

  timerFlipped = role === "w";

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
  publishBoardUpdate();
});

socket.on("move", function (move) {
  if (window.IS_COMPUTER_MODE) return;
  chess.move(move);
  renderBoard();
  renderResult();

  highlightActiveTimer(chess.turn());

  if (!chess.in_check()) {
    clearGameMessage();
  }
});


socket.on("timerUpdate", function (timers) {
  if(window.IS_COMPUTER_MODE) return;
  if (timerFlipped ) {

    whiteTimer.className = "timer2"; // Bottom position
    blackTimer.className = "timer1"; // Top position
    whiteTimer.textContent = `White: ${formatTime(timers.w)}`;
    blackTimer.textContent = `Black: ${formatTime(timers.b)}`;
  } else {

    whiteTimer.className = "timer1"; // Top position
    blackTimer.className = "timer2"; // Bottom position
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
publishBoardUpdate();

const highlightActiveTimer = (activeColor) => {
  whiteTimer.style.borderColor = activeColor === "w" ? "#10b981" : "#718096";
  blackTimer.style.borderColor = activeColor === "b" ? "#10b981" : "#718096";

  whiteTimer.style.boxShadow =
    activeColor === "w"
      ? "0 0 10px rgba(16, 185, 129, 0.5)"
      : "0 4px 8px rgba(0, 0, 0, 0.3)";
  blackTimer.style.boxShadow =
    activeColor === "b"
      ? "0 0 10px rgba(16, 185, 129, 0.5)"
      : "0 4px 8px rgba(0, 0, 0, 0.3)";
};

// squareElement.addEventListener("dragleave", function (e) {
//   // Remove hover classes when leaving a square
//   squareElement.classList.remove('square-hover-legal', 'square-hover-illegal');
// });
