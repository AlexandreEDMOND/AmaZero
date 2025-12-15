const SIZE = 7;
const MAX_TURNS = 256;
const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const boardEl = document.getElementById("board");
const metaEl = document.getElementById("meta");
const btnPlay = document.getElementById("play-pause");
const btnReset = document.getElementById("reset");
const speedInput = document.getElementById("speed");

let state = initialState();
let lastMove = null;
let playing = false;
let timer = null;
let delay = Number(speedInput?.value || 700);
let turn = 0;
let animating = false;

function initialState() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill("."));
  board[0][0] = "W";
  board[SIZE - 1][SIZE - 1] = "W";
  board[0][SIZE - 1] = "B";
  board[SIZE - 1][0] = "B";
  return { board, player: "W" };
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function ray(board, row, col, dr, dc) {
  const cells = [];
  let r = row + dr;
  let c = col + dc;
  while (inBounds(r, c) && board[r][c] === ".") {
    cells.push([r, c]);
    r += dr;
    c += dc;
  }
  return cells;
}

function legalMoves(st) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (st.board[r][c] !== st.player) continue;
      for (const [dr, dc] of DIRS) {
        for (const [tr, tc] of ray(st.board, r, c, dr, dc)) {
          const temp = cloneBoard(st.board);
          temp[r][c] = ".";
          temp[tr][tc] = st.player;
          for (const [ar, ac] of DIRS.flatMap(([adr, adc]) => ray(temp, tr, tc, adr, adc))) {
            moves.push({ from: [r, c], to: [tr, tc], arrow: [ar, ac] });
          }
        }
      }
    }
  }
  return moves;
}

function applyMove(st, mv) {
  const nextBoard = cloneBoard(st.board);
  nextBoard[mv.from[0]][mv.from[1]] = ".";
  nextBoard[mv.to[0]][mv.to[1]] = st.player;
  nextBoard[mv.arrow[0]][mv.arrow[1]] = "X";
  const nextPlayer = st.player === "W" ? "B" : "W";
  return { board: nextBoard, player: nextPlayer };
}

function render() {
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  const flat = state.board.flat();
  flat.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";
    const row = Math.floor(i / SIZE);
    const col = i % SIZE;
    if (lastMove && isHighlight(lastMove, row, col)) {
      div.classList.add("highlight");
    }
    if (cell !== ".") {
      const piece = document.createElement("div");
      piece.classList.add("piece");
      if (cell === "W") {
        piece.classList.add("white");
        piece.textContent = "W";
      }
      if (cell === "B") {
        piece.classList.add("black");
        piece.textContent = "B";
      }
      if (cell === "X") piece.classList.add("arrow");
      div.appendChild(piece);
    }
    boardEl.appendChild(div);
  });
  metaEl.textContent = `Tour ${turn} — joueur: ${state.player}`;
}

function isHighlight(mv, row, col) {
  return (
    (mv.from[0] === row && mv.from[1] === col) ||
    (mv.to[0] === row && mv.to[1] === col) ||
    (mv.arrow[0] === row && mv.arrow[1] === col)
  );
}

function tick() {
  if (!playing) return;
  if (animating) return;
  const moves = legalMoves(state);
  if (!moves.length || turn >= MAX_TURNS) {
    playing = false;
    btnPlay.textContent = "Jouer";
    metaEl.textContent = moves.length ? "Fin: limite de tours atteinte" : `Fin: ${state.player} bloque`;
    return;
  }
  const mv = moves[Math.floor(Math.random() * moves.length)];
  animateMove(mv, state.player, () => {
    lastMove = mv;
    state = applyMove(state, mv);
    turn += 1;
    render();
    animateArrow(mv);
    timer = setTimeout(tick, delay);
  });
}

function playPause() {
  playing = !playing;
  btnPlay.textContent = playing ? "Pause" : "Jouer";
  if (playing) {
    clearTimeout(timer);
    timer = setTimeout(tick, delay);
  } else {
    clearTimeout(timer);
  }
}

function reset() {
  playing = false;
  clearTimeout(timer);
  btnPlay.textContent = "Jouer";
  state = initialState();
  lastMove = null;
  turn = 0;
  render();
}

function adjustSpeed(e) {
  delay = Number(e.target.value);
}

function animateMove(mv, color, onDone) {
  const origin = cellEl(mv.from);
  const target = cellEl(mv.to);
  if (!origin || !target) {
    onDone();
    return;
  }
  const pieceEl = origin.querySelector(".piece");
  if (pieceEl) pieceEl.style.opacity = "0.2";

  const floating = document.createElement("div");
  floating.className = `piece ${color === "W" ? "white" : "black"} moving`;

  const boardRect = boardEl.getBoundingClientRect();
  const oRect = origin.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();

  const size = oRect.width * 0.7;
  const startLeft = oRect.left - boardRect.left + (oRect.width - size) / 2;
  const startTop = oRect.top - boardRect.top + (oRect.height - size) / 2;
  const endLeft = tRect.left - boardRect.left + (tRect.width - size) / 2;
  const endTop = tRect.top - boardRect.top + (tRect.height - size) / 2;

  floating.style.width = `${size}px`;
  floating.style.height = `${size}px`;
  floating.style.left = `${startLeft}px`;
  floating.style.top = `${startTop}px`;
  floating.style.transform = "translate(0, 0)";

  boardEl.appendChild(floating);
  animating = true;
  requestAnimationFrame(() => {
    floating.style.transform = `translate(${endLeft - startLeft}px, ${endTop - startTop}px)`;
  });

  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    animating = false;
    floating.remove();
    if (pieceEl) pieceEl.style.opacity = "1";
    onDone();
  };
  floating.addEventListener("transitionend", done, { once: true });
  setTimeout(done, 360); // safety
}

function animateArrow(mv) {
  const arrowCell = cellEl(mv.arrow);
  if (!arrowCell) return;
  const arrowEl = arrowCell.querySelector(".piece.arrow");
  if (!arrowEl) return;
  arrowEl.classList.add("arrow-pop");
  setTimeout(() => arrowEl.classList.remove("arrow-pop"), 260);
}

function cellEl([r, c]) {
  const idx = r * SIZE + c;
  return boardEl.children[idx];
}

btnPlay?.addEventListener("click", playPause);
btnReset?.addEventListener("click", reset);
speedInput?.addEventListener("input", adjustSpeed);

reset();
