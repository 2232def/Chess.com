const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

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
  if (chess.isGameOver()) {
    let message = "";
    if (chess.isCheckmate()) {
      message = `Checkmate! ${
        chess.turn() === "w" ? "Black" : "white"
      } wins!`;
    } else if (chess.isDraw()) {
      if (chess.isStalemate()) {
        message = "Game over - Stalemate!";
      } else if (chess.isThreefoldRepetition()) {
        message = "Game over - Threefold Repetition!";
      } else if (chess.isInsufficientMaterial()) {
        message = "Game over - Draw by Insufficient Material!";
      } else {
        message = "Game over - Draw!";
      }
    }

    displayGameMessage(message);
  } else if (chess.isCheck()) {
    displayGameMessage("Check!");
  }
}

const displayGameMessage = (message) => {
  let messageElement = document.getElementById("game-message");
  if(!messageElement) {
    messageElement = document.createElement("div");
    messageElement.id = "game-message";
    messageElement.classList.add("game-message");
    document.body.appendChild(messageElement);

  }
  messageElement.textContent = message;
}

const disableDrag = () => {
  const squares = document.querySelectorAll(".square");
  squares.forEach((square) => {
    const piece = square.querySelector(".piece");
    if (piece) {
      piece.draggable = false;
    }
  })
}

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
    p: "♟",
    r: "♖",
    n: "♘",
    b: "♗",
    q: "♕",
    k: "♔",
    P: "♙",
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
  renderBoard();
});

socket.on("spectatorRole", function () {
  playerRole = null;
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
  
});

socket.on("inCheck",function(color){
  if(color === playerRole){
    displayGameMessage("You are in check!");
  }
  else{
    displayGameMessage("Your Opponent is in check!");
  }
})

socket.on("gameOver", function (message){
  displayGameMessage(message);
  disableDrag();
})

renderBoard();
