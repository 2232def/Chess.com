// Node worker that spawns the native Stockfish engine and proxies messages
const { parentPort, workerData } = require("node:worker_threads");
const { spawn } = require("node:child_process");

const exe = workerData && workerData.exePath ? workerData.exePath : "stockfish";

// Spawn the engine
const sf = spawn(exe, [], { stdio: ["pipe", "pipe", "pipe"] });

sf.on("error", (err) => {
  parentPort.postMessage("ERR " + err.message);
});

sf.stdout.on("data", (d) => {
  parentPort.postMessage(d.toString());
});

sf.stderr.on("data", (d) => {
  parentPort.postMessage("ERR " + d.toString());
});

// Receive commands from main thread and forward to engine
parentPort.on("message", (cmd) => {
  try {
    sf.stdin.write(String(cmd).trim() + "\n");
  } catch (e) {
    parentPort.postMessage("ERR write failed: " + e.message);
  }
});

// Graceful shutdown
const shutdown = () => {
  try { sf.stdin.end(); } catch {}
  try { sf.kill(); } catch {}
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
