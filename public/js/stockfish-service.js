let computerConfiguration = {
  color: 'black', // 'white' or 'black'
  level: 1
};

const STOCKFISH_API = "https://stockfish.online/api/s/v2.php";

const stockfishLevels = {
  1: 1,
  2: 3,
  3: 5,
  4: 8,
  5: 12
};

const FENChar = {
  WhiteKnight: 'N',
  BlackKnight: 'n',
  WhiteBishop: 'B',
  BlackBishop: 'b',
  WhiteRook: 'R',
  BlackRook: 'r',
  WhiteQueen: 'Q',
  BlackQueen: 'q'
};

function convertColumnLetterToYCoord(letter) {
    return letter.charCodeAt(0) - "a".charCodeAt(0);
}

function promotedPiece(piece) {
    if (!piece) return null;

    const computerColor = computerConfiguration.color;

    switch (piece){
        case "n":
            return computerColor ==='white' ?  FENChar.WhiteKnight : FENChar.BlackKnight;

        case "b":
            return computerColor ==='white' ?  FENChar.WhiteBishop : FENChar.BlackBishop;

        case "r":
            return computerColor ==='white' ?  FENChar.WhiteRook : FENChar.BlackRook;

        case "q":
            return computerColor ==='white' ?  FENChar.WhiteQueen : FENChar.BlackQueen;
    }
}

function moveFromStockfishString(move) {
    const prevY = convertColumnLetterToYCoord(move[0]);
    const prevX = Number(move[1]) - 1;
    const newY = convertColumnLetterToYCoord(move[2]);
    const newX = Number(move[3]) - 1;
    const promoted = promotedPiece(move[4]);

    return {
        prevX: prevX,
        prevY: prevY,
        newX: newX,
        newY: newY,
        promotedPiece: promoted
    };
}

function buildQueryParams(fen) {
    const depth = stockfishLevels[computerConfiguration.level] || 1;
    return `fen=${encodeURICComponent(fen)}&depth=${depth}`;
}

function getBestMove(fen, callback, errorCallback){
    const queryParams = buildQueryParams(fen);
    const url = `${STOCKFISH_API}?${queryParams}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error (`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const bestMoveString = data.bestmove.split("")[1];
            const move = moveFromStockfishString(bestMoveString);
            callback(move);
        })
        .catch(error => {
            console.error('Error getting best move:', error);
            if (errorCallback){
                errorCallback(error);
            }
        });
}

function updateComputerConfiguration(newConfig) {
    computerConfiguration = { ...computerConfiguration, ...newConfig};
}

function getComputerConfiguration() {
    return {...computerConfiguration};
}

function setComputerColor(color){
    updateComputerConfiguration({color: color});
}

function setComputerLevel(level) {
    if (level >= 1 && level <= 5) {
        updateComputerConfiguration({level: level});
    }
    else {
        console.warn("Invalid level. Please set a level between 1 and 5.");
    }
}