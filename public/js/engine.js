// Load Stockfish WASM engine
const Stockfish = require("stockfish");

async function testEngine() {
  const engine = await Stockfish();

  // Listen for messages from the engine
  engine.addMessageListener((line) => {
    console.log("Engine:", line);
  });

  // Initialize UCI (Universal Chess Interface)
  engine.postMessage("uci");

  // Set up starting position
  engine.postMessage("position startpos");

  // Ask engine to calculate best move with depth 10
  engine.postMessage("go depth 10");
}

testEngine();
