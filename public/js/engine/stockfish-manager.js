const { Worker } = require("node:worker_threads");
const path = require("path");
const fs = require("fs");

class StockfishManager {
  constructor() {
    this.engines = new Map();
    this.enginePath = this.resolveEnginePath();
  }

  resolveEnginePath() {
    const bundleExe = path.join(
      __dirname,
      "bin",
      "stockfish-windows-x86-64-avx2",
      "stockfish",
      "stockfish-windows-x86-64-avx2.exe"
    );

    return process.env.STOCKFISH_EXE
    ? process.env.STOCKFISH_EXE
    : fs.existsSync(bundleExe)
    ? bundleExe
    : "stockfish";
  }

  createEngine(roomId, difficulty = "medium") {
    if( this.engines.has(roomId)) {
        this.destroyEngine(roomId);
    }

    const worker = new Worker(path.join(__dirname, "node-worker-runner.js"), {
        workerData: {exePath: this.enginePath},
    });

    const engine = {
      worker,
      difficulty,
      isReady: false,
      pendingCommands: [],
    };

    worker.postMessage("uci");
    worker.postMessage("isready");

    worker.on("message", (msg) => {
      const message = String(msg).trim();
      console.log(`Engine ${roomId}: ${message}`);

      if (message === "readyok"){
        engine.isReady = true;
        engine.pendingCommands.forEach(cmd => worker.postMessage(cmd));
        engine.pendingCommands = [];
      }

      if (message.startsWith("bestmove")) {
        this.handleBestMove(roomId, message);
      }
    });

    worker.on("error", (err) => {
      console.error(`Engine error for room ${roomId}:`, err);
    });

    this.engines.set(roomId, engine);
    return engine;
  }

  makeMove(roomId, fen, callback){
    const engine = this.engines.get(roomId);
    if(!engine){
      console.error(`No engine found for room ${roomId}`);
      return;
    }

    engine.moveCallback = callback;

    const depth = this.getDifficultyDepth(engine.difficulty);
    const commands = [
      "ucinewgame"
      `position fen ${fen}`,
      `go depth ${depth}`
    ];

    if (engine.isReady) {
       commands.forEach(cmd =>  engine.worker.postMessage(cmd));
    } else {
      engine.pendingCommands.push(...commands);
    }
  }

  getDifficultyDepth(difficulty){
    switch (difficulty) {
      case "easy": return 5;
      case "medium": return 10;
      case "hard": return 15;
      case "expert": return 20;
      default: return 10;
    }
  }

  handleBestMove(roomId, message) {
    const engine = this.engines.get(roomId);
    if( !engine || !engine.moveCallback) return;

    const parts = message.split(" ");
    if (parts.length >= 2 && parts[1] !== "(none)") {
      const move = parts[1];
      engine.moveCallback(move);
    }
    delete engine.moveCallback;
  }

  destroyEngine(roomId) {
    const engine = this.engines.get(roomId);
    if(engine) {
      try {
        engine.worker.terminate();
      } catch (e) {
        console.error(`Error terminating engine for room ${roomId}:`, e);
      }
      this.engines.delete(roomId);
      console.log(`Engine destroyed for room ${roomId}`);
    }
  }

  destroyAllEngines() {
    for (const roomId of this.engines.keys()){
      this.destroyEngine(roomId); 
    }
  }
}

module.exports = new StockfishManager();  
