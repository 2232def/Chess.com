const TOAST_ID = "game-toast";
let lastStatus = "";

function ensureToast() {
    let el = document.getElementById(TOAST_ID);
    if (el) return el;
    el = document.createElement("div");
    el.id = TOAST_ID;
    el.style.cssText = 
      "position:fixed;top:20px;left:50%;transform:translateX(-50%);" +
      "background:#111;color:#fff;padding:10px 16px;border-radius:8px;" +
      "border:2px solid #d4af37;box-shadow:0 0 16px rgba(212,175,55,.4);" +
      "font-family:system-ui,Arial,sans-serif;z-index:2000;display:none;";

    document.body.appendChild(el);
    return el;
}

function showToast(msg){
    const el = ensureToast();
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(el._hideT);
}

function statusFromFen(fen) {
    try {
        const turn  = fen.split(" ")[1];
        const game = new window.Chess();
        console.log("chess instance" , game);

        game.load(fen);

        if (game.in_checkmate && game.in_checkmate()){
            const winner = turn === "w" ? "Black" : "White";
            return {key: "mate", text: `checkmate! ${winner} wins`};
        }

        if (game.in_stalemate && game.in_stalemate()){
            return {key: "stalemate", text: "draw by stalemate"};
        }

        if (game.in_threefold_repetition && game.in_threefold_repetition()){
            return {key: "threefold", text: "draw by threefold repetition"};
        }
        if (game.insufficient_material && game.insufficient_material()){
            return {key: "insufficient", text: "draw by insufficient material"};
        }
        if (game.in_draw && game.in_draw()){
            return {key: "draw", text: "draw"};
        }

        if (game.in_check && game.in_check()){
            const player = turn === "w" ? "White" : "Black";
            return {key: "check", text: `${player} is in check`};
        }
        return {key: "normal", text: ""};
    }
    catch(e){
        console.error("statusFromFen error", e);
        return {key: "error", text: ""};
    }
}

function stopLocalTimers(key) {
    if (!window.LocalTimer) return;
    if (key === "mate" || key === "stalemate" || key === "material" || key === "threefold" || key === "draw"){
        window.LocalTimer.stop("w");
        window.LocalTimer.stop("b");
    }
}

document.addEventListener("board:fen" ,  (e) => {
    const fen = e.detail.fen;
    if(!fen || !window.chesss) return;
    const st = statusFromFen(fen);
    if (st.key !== lastStatus){
        lastStatus = st.key;
        if (st.text) showToast(st.text);
        stopLocalTimers(st.key);
        if (st.key === "mate" ){
            window.IS_GAME_OVER = true;
        }
    }
})