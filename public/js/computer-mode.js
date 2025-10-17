const Svc = window.stockfishService;

let engineBusy = false;

const chessboard = document.getElementById("chessboard");

function isComputersTurn(fen) {
    const turnChar = fen.split(' ')[1];
    const compChar = (Svc.getComputerConfiguration().color || 'black') === 'white' ? 'w' : 'b';
    return turnChar === compChar; 
} 

async function computerMove(fen) {
    if (engineBusy) return;
    const game = window.chesss;
    if(!Svc || !window.chesss) return;
    engineBusy = true;
    try{
        const move = await Svc.getBestMove(fen);
        // console.log('Computer move:', move);
        const result = window.chesss.move(move);
        if (result) {
            if (typeof window.renderBoard === 'function') window.renderBoard();
            if (typeof window.publishBoardUpdate === 'function') window.publishBoardUpdate();
            if (typeof window.highlightActiveTimer === 'function') window.highlightActiveTimer(game.turn("black") ? 'b' : 'w');
            // console.log('[Engine]', result.san, 'FEN:' , window.chesss.fen());
        }
    }
    catch (err) {
        console.error('Engine error:', err);
    }
    finally {
        engineBusy = false;
    }
}

function createComputerMode() {
    document.addEventListener('board:fen',  (e) => {
        const fen = e.detail.fen;
        if (isComputersTurn(fen)){
            computerMove(fen)
            return setInterval;
        } else {
            return null;
        }
    });

    // const fen = window.chesss.fen();
    // if (isComputersTurn(fen)){
    //     computerMove(fen);
    // }
}

let lastTurn = null;

function attachTimerTurnSwitch() {
    if (!window.LocalTimer) return;
    document.addEventListener('board:fen',  (e) => {
        const fen = e.detail.fen;
        const turnChar = fen.split(' ')[1];
        // console.log('FEN received for timer switch:', fen, 'turnChar:', turnChar, 'lastTurn:', lastTurn);
        if (lastTurn !== turnChar){
            window.LocalTimer.switchTo(turnChar);
            lastTurn = turnChar;
        }
    });
}

const originalCreate = window.createComputerMode;
window.createComputerMode = function() {
    if (typeof originalCreate === 'function') originalCreate();
    if (window.IS_COMPUTER_MODE) {
        window.LocalTimer.init(300);
        window.LocalTimer.start('w');
        lastTurn = 'w';
        attachTimerTurnSwitch();
    }
};

window.createComputerMode = createComputerMode;