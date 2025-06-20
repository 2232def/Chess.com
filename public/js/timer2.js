let _io = null;
let timers = {
    w: 60,
    b: 60,
};

let increment = 1;

let intervalIds = {
    w: null,
    b: null,
};

function initTimers(io){
    _io = io;
    timers = { w: 60 , b: 60 }
    io.emit("timerUpdate", timers);
}

function startTimer(color, providedIo) {
    const io = providedIo || _io;
    if (intervalIds[color]) return;

    intervalIds[color] = setInterval(() => {
        timers[color]--;
        if (timers[color] <= 0){
            timers[color] = 0;
            clearInterval(intervalIds[color]);
            io.emit(
                "gameOver",
                `Time out! ${color === "w" ? "Black" : "White"} wins!`
            );
            clearInterval(intervalIds["w"]);
            clearInterval(intervalIds["b"]);
        }
        io.emit("timerUpdate", timers);
    }, 1000);
}

function stopTimer(color){
    if (intervalIds[color]){
        clearInterval(intervalIds[color]);
        intervalIds[color] = null;
    }
}

function addIncrement(color) {
    timers[color] += increment;
    if(_io){
        _io.emit("timerUpdate", timers);
    }
}

function resetTimers(io) {
    timers = {w: 60, b: 60 };
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
    addIncrement
};