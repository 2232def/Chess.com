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
    if(!Svc || !window.chesss) return;
    engineBusy = true;
    try{
        const move = await Svc.getBestMove(fen);
        console.log('Computer move:', move);
        const result = window.chesss.move(move);
        if (result) {
            if (typeof window.renderBoard === 'function') window.renderBoard();
            if (typeof window.publishBoardUpdate === 'function') window.publishBoardUpdate();
            console.log('[Engine]', result.san, 'FEN:' , window.chesss.fen());
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
            computerMove(fen);
        }
    });

    const fen = window.chesss.fen();
    if (isComputersTurn(fen)){
        computerMove(fen);
    }
}

window.createComputerMode = createComputerMode;