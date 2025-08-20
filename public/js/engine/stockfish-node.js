const { Worker } = require("node:worker_threads");
const path = require("path");
const fs = require("fs");

// Resolve a sensible default path to the bundled Windows binary, if present
const bundledExe = path.join(
  __dirname,
  "bin",
  "stockfish-windows-x86-64-avx2",
  "stockfish",
  "stockfish-windows-x86-64-avx2.exe"
);

const resolvedExe = process.env.STOCKFISH_EXE
  ? process.env.STOCKFISH_EXE
  : fs.existsSync(bundledExe)
  ? bundledExe
  : "stockfish"; // fallback to PATH

// Point to the worker file with an absolute path
const worker = new Worker(path.join(__dirname, "node-worker-runner.js"), {
  workerData: {
    // Absolute path to your stockfish.exe or a command on PATH
    exePath: resolvedExe,
  },
});

worker.on("message", (msg) => console.log("Stockfish:", String(msg).trim()));
worker.on("error", (err) => console.error("Worker error:", err));
worker.on("exit", (code) => console.log("Worker exited with code:", code));

// Example UCI flow
worker.postMessage("uci");
worker.postMessage("isready");
worker.postMessage("ucinewgame");
worker.postMessage("position startpos");
worker.postMessage("go depth 12");