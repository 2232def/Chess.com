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
  if (typeof letter !== 'string' || letter.length < 1) {
    throw new Error('Invalid file letter for convertColumnLetterToYCoord');
  }
  return letter.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
}

function promotedPiece(piece) {
  if (!piece) return null;
  const computerColor = computerConfiguration.color;
  switch (piece.toLowerCase()) {
    case "n": return computerColor === 'white' ? FENChar.WhiteKnight : FENChar.BlackKnight;
    case "b": return computerColor === 'white' ? FENChar.WhiteBishop : FENChar.BlackBishop;
    case "r": return computerColor === 'white' ? FENChar.WhiteRook   : FENChar.BlackRook;
    case "q": return computerColor === 'white' ? FENChar.WhiteQueen  : FENChar.BlackQueen;
    default: return null;
  }
}

function moveFromStockfishString(move) {
  if (typeof move !== 'string' || move.length < 4) {
    throw new Error(`Invalid UCI move: ${move}`);
  }
  const prevY = convertColumnLetterToYCoord(move[0]);   
  const prevX = Number(move[1]) - 1;                    
  const newY  = convertColumnLetterToYCoord(move[2]);
  const newX  = Number(move[3]) - 1;
  const promoted = promotedPiece(move[4]);

  return { prevX, prevY, newX, newY, promotedPiece: promoted };
}

function buildQueryParams(fen) {
  const depth = stockfishLevels[computerConfiguration.level] || 1;
  return `fen=${encodeURIComponent(fen)}&depth=${depth}`;
}


function extractUciToken(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (/^[a-h][1-8][a-h][1-8][nbrq]?$/i.test(s)) return s;
  const tok = s.split(/\s+/).find(t => /^[a-h][1-8][a-h][1-8][nbrq]?$/i.test(t));
  return tok || null;
}


function uciToChessJsMove(uci) {
  const m = String(uci || '').trim().toLowerCase();
  if (!/^[a-h][1-8][a-h][1-8][nbrq]?$/i.test(m)) {
    throw new Error(`Invalid UCI: ${uci}`);
  }
  const from = m.slice(0, 2);
  const to = m.slice(2, 4);
  const promo = m[4] ? m[4].toLowerCase() : undefined; 
  return promo ? { from, to, promotion: promo } : { from, to };
}

function getBestMove(fen, callback, errorCallback) {
  const url = `${STOCKFISH_API}?${buildQueryParams(fen)}`;
  const p = fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      const uci = extractUciToken(data.bestmove);
      if (!uci) throw new Error(`No valid bestmove token in response: ${JSON.stringify(data)}`);
      const move = uciToChessJsMove(uci);
      if (typeof callback === 'function') callback(move);
      return move;
    })
    .catch(err => {
      console.error('Error getting best move:', err);
      if (typeof errorCallback === 'function') errorCallback(err);
      throw err;
    });
  return p;
}

function updateComputerConfiguration(newConfig) {
  computerConfiguration = { ...computerConfiguration, ...newConfig };
}

function getComputerConfiguration() {
  return { ...computerConfiguration };
}

function setComputerColor(color) {
  updateComputerConfiguration({ color });
}

function setComputerLevel(level) {
  if (level >= 1 && level <= 5) updateComputerConfiguration({ level });
  else console.warn('Invalid level. Please set a level between 1 and 5.');
}

window.stockfishService = {
  getBestMove,
  setComputerColor,
  setComputerLevel,
  getComputerConfiguration,
  updateComputerConfiguration
};