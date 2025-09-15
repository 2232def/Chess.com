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
    el._hideT = setTimeout(() => (el.style.display = "none"), 2000);
}

function statusFromFen(fen) {
    try {
        const turn  = fen.split(" ")[1];
        const game = (window.chesss && typeof window.chesss.fen === "function")
          ? window.chesss.fen()
          : new window.Chess();

        if (game !== window.chesss ) game.load(fen);

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