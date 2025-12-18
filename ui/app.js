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
const btnReset = document.getElementById("reset");
const modeSelect = document.getElementById("mode");
const humanSideSelect = document.getElementById("human-side");
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const statsWhiteSelect = document.getElementById("stats-white");
const statsBlackSelect = document.getElementById("stats-black");
const statsGamesInput = document.getElementById("stats-games");
const statsRunBtn = document.getElementById("stats-run");
const statsResetBtn = document.getElementById("stats-reset");
const statsWhiteWin = document.getElementById("stats-white-win");
const statsBlackWin = document.getElementById("stats-black-win");
const statsDrawWin = document.getElementById("stats-draw-win");
const statsWhiteCount = document.getElementById("stats-white-count");
const statsBlackCount = document.getElementById("stats-black-count");
const statsDrawCount = document.getElementById("stats-draw-count");
const statsTotalEl = document.getElementById("stats-total");
const statsProgressEl = document.getElementById("stats-progress");

let state = initialState();
let lastMove = null;
let turn = 0;
let animating = false;
let mode = modeSelect?.value || "random";
let humanSide = humanSideSelect?.value || "W";
let selection = { origin: null, target: null };
let cachedMoves = null;
let statsRunning = false;
let statsTotal = 0;
let statsPlayed = 0;
let statsWins = { W: 0, B: 0, D: 0 };

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

function getLegalMoves() {
  if (!cachedMoves) cachedMoves = legalMoves(state);
  return cachedMoves;
}

function keyOf([r, c]) {
  return `${r},${c}`;
}

function mobility(board, player) {
  let count = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== player) continue;
      for (const [dr, dc] of DIRS) {
        count += ray(board, r, c, dr, dc).length;
      }
    }
  }
  return count;
}

function pickHeuristicMove(st, moves) {
  if (!moves.length) return null;
  const opponent = st.player === "W" ? "B" : "W";
  let bestScore = -Infinity;
  let bestMoves = [];
  for (const mv of moves) {
    const nextBoard = cloneBoard(st.board);
    nextBoard[mv.from[0]][mv.from[1]] = ".";
    nextBoard[mv.to[0]][mv.to[1]] = st.player;
    nextBoard[mv.arrow[0]][mv.arrow[1]] = "X";
    const score = mobility(nextBoard, st.player) - mobility(nextBoard, opponent);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [mv];
    } else if (score === bestScore) {
      bestMoves.push(mv);
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function chooseMove(st) {
  const moves = getLegalMoves();
  if (!moves.length) return null;
  if (mode === "heuristic") {
    return pickHeuristicMove(st, moves);
  }
  return moves[Math.floor(Math.random() * moves.length)];
}

function chooseMoveForMode(st, modeType) {
  const moves = legalMoves(st);
  if (!moves.length) return null;
  if (modeType === "heuristic") {
    return pickHeuristicMove(st, moves);
  }
  return moves[Math.floor(Math.random() * moves.length)];
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
  const humanTurn = isHumanTurn();
  const moves = humanTurn ? getLegalMoves() : [];
  const highlights = computeHighlights(moves);
  flat.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";
    const row = Math.floor(i / SIZE);
    const col = i % SIZE;
    if (lastMove && isHighlight(lastMove, row, col)) {
      div.classList.add("highlight");
    }
    if (humanTurn && highlights.selectable.has(keyOf([row, col]))) {
      div.classList.add("selectable");
    }
    if (selection.origin && selection.origin[0] === row && selection.origin[1] === col) {
      div.classList.add("selected");
    }
    if (selection.target && selection.target[0] === row && selection.target[1] === col) {
      div.classList.add("selected");
    }
    if (humanTurn && highlights.targets.has(keyOf([row, col]))) {
      div.classList.add("target");
    }
    if (humanTurn && highlights.arrows.has(keyOf([row, col]))) {
      div.classList.add("arrow-target");
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
  const modeLabel = mode === "heuristic" ? "heuristique" : "aleatoire";
  if (humanTurn && moves.length === 0) {
    metaEl.textContent = `Fin: ${state.player} bloque — mode: ${modeLabel} — humain: ${humanSide}`;
    return;
  }
  const turnLabel = humanTurn ? "A toi de jouer" : "IA en cours";
  metaEl.textContent = `${turnLabel} — mode: ${modeLabel} — humain: ${humanSide}`;
}

function isHighlight(mv, row, col) {
  return (
    (mv.from[0] === row && mv.from[1] === col) ||
    (mv.to[0] === row && mv.to[1] === col) ||
    (mv.arrow[0] === row && mv.arrow[1] === col)
  );
}

function triggerAiMove() {
  if (animating) return;
  if (isHumanTurn()) return;
  if (turn >= MAX_TURNS) {
    metaEl.textContent = "Fin: limite de tours atteinte";
    return;
  }
  const mv = chooseMove(state);
  if (!mv) {
    metaEl.textContent = `Fin: ${state.player} bloque`;
    return;
  }
  animateMove(mv, state.player, () => {
    lastMove = mv;
    state = applyMove(state, mv);
    cachedMoves = null;
    turn += 1;
    render();
    animateArrow(mv);
  });
}

function reset() {
  state = initialState();
  lastMove = null;
  turn = 0;
  selection = { origin: null, target: null };
  cachedMoves = null;
  render();
  setTimeout(triggerAiMove, 0);
}

function adjustAiMode(e) {
  mode = e.target.value;
  render();
}

function adjustHumanSide(e) {
  humanSide = e.target.value;
  reset();
}

function isHumanTurn() {
  return state.player === humanSide;
}

function setActiveTab(tabName) {
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  tabContents.forEach((section) => {
    section.classList.toggle("active", section.id === tabName);
  });
}

function simulateGame(whiteMode, blackMode, maxTurns = MAX_TURNS) {
  let simState = initialState();
  let turns = 0;
  while (turns < maxTurns) {
    const modeType = simState.player === "W" ? whiteMode : blackMode;
    const mv = chooseMoveForMode(simState, modeType);
    if (!mv) {
      return simState.player === "W" ? "B" : "W";
    }
    simState = applyMove(simState, mv);
    turns += 1;
  }
  return "D";
}

function updateStatsDisplay() {
  const total = Math.max(statsPlayed, 1);
  const whitePct = Math.round((statsWins.W / total) * 100);
  const blackPct = Math.round((statsWins.B / total) * 100);
  const drawPct = Math.round((statsWins.D / total) * 100);
  statsWhiteWin.textContent = `${whitePct}%`;
  statsBlackWin.textContent = `${blackPct}%`;
  statsDrawWin.textContent = `${drawPct}%`;
  statsWhiteCount.textContent = `${statsWins.W} victoires`;
  statsBlackCount.textContent = `${statsWins.B} victoires`;
  statsDrawCount.textContent = `${statsWins.D} nuls`;
  statsTotalEl.textContent = `${statsPlayed}`;
  statsProgressEl.textContent = `${statsPlayed} / ${statsTotal}`;
}

function resetStats() {
  statsRunning = false;
  statsTotal = 0;
  statsPlayed = 0;
  statsWins = { W: 0, B: 0, D: 0 };
  updateStatsDisplay();
}

function runStatsBatch() {
  if (!statsRunning) return;
  const remaining = statsTotal - statsPlayed;
  if (remaining <= 0) {
    statsRunning = false;
    return;
  }
  const batch = Math.min(10, remaining);
  const whiteMode = statsWhiteSelect.value;
  const blackMode = statsBlackSelect.value;
  for (let i = 0; i < batch; i += 1) {
    const result = simulateGame(whiteMode, blackMode);
    if (result === "W") statsWins.W += 1;
    else if (result === "B") statsWins.B += 1;
    else statsWins.D += 1;
    statsPlayed += 1;
  }
  updateStatsDisplay();
  setTimeout(runStatsBatch, 0);
}

function startStats() {
  const games = Number(statsGamesInput.value || 0);
  if (!Number.isFinite(games) || games <= 0) return;
  statsRunning = true;
  statsTotal = games;
  statsPlayed = 0;
  statsWins = { W: 0, B: 0, D: 0 };
  updateStatsDisplay();
  runStatsBatch();
}

function computeHighlights(moves) {
  const selectable = new Set();
  const targets = new Set();
  const arrows = new Set();
  if (!moves.length) return { selectable, targets, arrows };
  if (!selection.origin) {
    for (const mv of moves) {
      selectable.add(keyOf(mv.from));
    }
    return { selectable, targets, arrows };
  }
  if (!selection.target) {
    for (const mv of moves) {
      if (mv.from[0] === selection.origin[0] && mv.from[1] === selection.origin[1]) {
        targets.add(keyOf(mv.to));
      }
    }
    return { selectable, targets, arrows };
  }
  for (const mv of moves) {
    if (
      mv.from[0] === selection.origin[0] &&
      mv.from[1] === selection.origin[1] &&
      mv.to[0] === selection.target[0] &&
      mv.to[1] === selection.target[1]
    ) {
      arrows.add(keyOf(mv.arrow));
    }
  }
  return { selectable, targets, arrows };
}

function onBoardClick(e) {
  if (!isHumanTurn()) return;
  const cell = e.target.closest(".cell");
  if (!cell) return;
  const index = Array.from(boardEl.children).indexOf(cell);
  const r = Math.floor(index / SIZE);
  const c = index % SIZE;
  const moves = getLegalMoves();
  if (!selection.origin) {
    if (state.board[r][c] === state.player) {
      selection.origin = [r, c];
      render();
    }
    return;
  }
  if (!selection.target) {
    if (selection.origin[0] === r && selection.origin[1] === c) {
      selection.origin = null;
      render();
      return;
    }
    if (state.board[r][c] === state.player) {
      selection.origin = [r, c];
      render();
      return;
    }
    const hasTarget = moves.some(
      (mv) =>
        mv.from[0] === selection.origin[0] &&
        mv.from[1] === selection.origin[1] &&
        mv.to[0] === r &&
        mv.to[1] === c
    );
    if (hasTarget) {
      selection.target = [r, c];
      render();
    }
    return;
  }
  const move = moves.find(
    (mv) =>
      mv.from[0] === selection.origin[0] &&
      mv.from[1] === selection.origin[1] &&
      mv.to[0] === selection.target[0] &&
      mv.to[1] === selection.target[1] &&
      mv.arrow[0] === r &&
      mv.arrow[1] === c
  );
  if (move) {
    lastMove = move;
    state = applyMove(state, move);
    cachedMoves = null;
    selection = { origin: null, target: null };
    turn += 1;
    render();
    animateArrow(move);
    setTimeout(triggerAiMove, 0);
  }
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

btnReset?.addEventListener("click", reset);
modeSelect?.addEventListener("change", adjustAiMode);
humanSideSelect?.addEventListener("change", adjustHumanSide);
boardEl?.addEventListener("click", onBoardClick);
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
});
statsRunBtn?.addEventListener("click", startStats);
statsResetBtn?.addEventListener("click", resetStats);

reset();
resetStats();
setActiveTab("stats");
