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
  timers.w = 300; // Reset to 5 minutes
  timers.b = 300; // Reset to 5 minutes
  io.emit("timerUpdate", { ...timers });
}

function  startTimer(color, providedIo) {
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
  timers.w = 300; // Reset to 5 minutes
  timers.b = 300; // Reset to 5 minutes
  stopTimer("w");
  stopTimer("b");
  io.emit("timerUpdate", { ...timers });
}

function getTimers() {
  return { ...timers };
}

if (typeof window !== "undefined") {
  const localEmitter = {
    emit(event, payload){
      document.dispatchEvent(new CustomEvent("timer:" + event, {detail: payload}));
    }
  };

  window.LocalTimer = {
    init(initialSeconds = 300) {
      timers.w = initialSeconds;
      timers.b = initialSeconds;
      _io = localEmitter;
      localEmitter.emit("timerUpdate",{ ...timers });
     },
     start(color) {
      startTimer(color, localEmitter);
     },
     stop(color) {
      stopTimer(color);
     },
     switchTo(color) {
      const other = color === 'w' ? 'b' : 'w';
      stopTimer(other);
      startTimer(color, localEmitter);
      console.log('Timer switched to', color , '-timers:', timers);
     },
     reset(initialSeconds = 300){
      timers.w = initialSeconds;
      timers.b = initialSeconds;
      stopTimer('w');
      stopTimer('b');
      localEmitter.emit("timerUpdate",{ ...timers });
     },
     get() {
      return getTimers();
     },
  };
}

module.exports = {
  initTimers,
  startTimer,
  stopTimer,
  resetTimers,
  getTimers,
};
