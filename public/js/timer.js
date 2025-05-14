let _io = null;
let timers = {
  w: 300, // 5 minutes for white
  b: 300, // 5 minutes for black
};

let intervalIds = {
  w: null,
  b: null,
};

function initTimers(io) {
  _io = io;
  timers = { w: 300, b: 300 };
  io.emit("timerUpdate", timers);
}

function startTimer(color, providedIo) {
  const io = providedIo || _io;
  if (intervalIds[color]) return;

  intervalIds[color] = setInterval(() => {
    timers[color]--;
    if (timers[color] <= 0) {
      timers[color] = 0;
      clearInterval(intervalIds[color]);
    }
    io.emit("timerUpdate", timers);

    if (timers[color] === 0) {
      io.emit(
        "gameOver",
        `Time out! ${color === "w" ? "Black" : "White"} wins!`
      );
      clearInterval(intervalIds["w"]);
      clearInterval(intervalIds["b"]);
    }
  }, 1000);
}

function stopTimer(color) {
  if (intervalIds[color]) {
    clearInterval(intervalIds[color]);
    intervalIds[color] = null;
  }
}

function resetTimers(io) {
  timers = { w: 300, b: 300 };
  stopTimer("w");
  stopTimer("b");
  io.emit("timerUpdate", timers);
}

function getTimers() {
  return timers;
}

module.exports = {
  initTimers,
  startTimer,
  stopTimer,
  resetTimers,
  getTimers,
};
