(function () {
  const storageKey = "codyhadley-2048-best";
  const size = 4;
  const moveDuration = 165;
  const boardElement = document.getElementById("board");
  const cellsElement = document.getElementById("cells");
  const tileLayer = document.getElementById("tile-layer");
  const scoreElement = document.getElementById("score");
  const bestElement = document.getElementById("best");
  const messageElement = document.getElementById("game-message");
  const messageTitle = document.getElementById("game-message-title");
  const messageText = document.getElementById("game-message-text");
  const messageButton = document.getElementById("game-message-button");
  const newGameButton = document.getElementById("new-game");
  const nextFrame = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 16));

  if (!boardElement || !cellsElement || !tileLayer || !scoreElement || !bestElement || !messageElement || !messageTitle || !messageText || !messageButton || !newGameButton) {
    return;
  }

  function readBest() {
    try {
      return Number(localStorage.getItem(storageKey)) || 0;
    } catch (err) {
      return 0;
    }
  }

  function writeBest(value) {
    try {
      localStorage.setItem(storageKey, String(value));
    } catch (err) {}
  }

  let board = [];
  let score = 0;
  let best = readBest();
  let won = false;
  let gameOver = false;
  let animating = false;
  let touchStart = null;

  bestElement.textContent = String(best);

  for (let index = 0; index < size * size; index += 1) {
    const cell = document.createElement("div");
    cell.className = "game-cell";
    cell.setAttribute("role", "presentation");
    cellsElement.appendChild(cell);
  }

  function createEmptyBoard() {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function startGame() {
    board = createEmptyBoard();
    score = 0;
    won = false;
    gameOver = false;
    animating = false;
    messageElement.hidden = true;
    addRandomTile();
    const spawned = addRandomTile();
    renderTiles(spawned);
    updateScores();
  }

  function addRandomTile() {
    const empty = [];
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (board[row][col] === 0) empty.push({ row, col });
      }
    }
    if (!empty.length) return;
    const cell = empty[Math.floor(Math.random() * empty.length)];
    board[cell.row][cell.col] = Math.random() < 0.9 ? 2 : 4;
    return cell;
  }

  function updateScores() {
    scoreElement.textContent = String(score);
    bestElement.textContent = String(best);
  }

  function translateFor(row, col) {
    const xGap = col ? ` + ${Array(col).fill("var(--board-gap)").join(" + ")}` : "";
    const yGap = row ? ` + ${Array(row).fill("var(--board-gap)").join(" + ")}` : "";
    return `translate(calc(${col * 100}%${xGap}), calc(${row * 100}%${yGap}))`;
  }

  function positionTile(tile, row, col) {
    tile.style.transform = translateFor(row, col);
  }

  function createTile(value, row, col, className) {
    const tile = document.createElement("div");
    tile.className = `tile ${className}`.trim();
    tile.dataset.value = String(value);
    positionTile(tile, row, col);
    tile.setAttribute("role", "gridcell");
    tile.setAttribute("aria-label", String(value));
    const inner = document.createElement("div");
    inner.className = "tile-inner";
    inner.textContent = String(value);
    tile.appendChild(inner);
    return tile;
  }

  function renderTiles(newCell, mergeCells = new Set(), delayMerge = false) {
    tileLayer.replaceChildren();
    const delayed = [];
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const value = board[row][col];
        if (!value) continue;
        const key = `${row}-${col}`;
        const isMerge = mergeCells.has(key);
        const classes = [
          newCell && newCell.row === row && newCell.col === col ? "new" : "",
          isMerge && !delayMerge ? "merge" : ""
        ].filter(Boolean).join(" ");
        const tile = createTile(value, row, col, classes);
        if (isMerge && delayMerge) delayed.push(tile);
        tileLayer.appendChild(tile);
      }
    }
    if (delayed.length) {
      nextFrame(() => {
        delayed.forEach((tile) => tile.classList.add("merge"));
      });
    }
  }

  function lineCells(direction, index) {
    const cells = [];
    for (let offset = 0; offset < size; offset += 1) {
      if (direction === "left") cells.push({ row: index, col: offset });
      if (direction === "right") cells.push({ row: index, col: size - 1 - offset });
      if (direction === "up") cells.push({ row: offset, col: index });
      if (direction === "down") cells.push({ row: size - 1 - offset, col: index });
    }
    return cells;
  }

  function buildMove(direction) {
    const next = createEmptyBoard();
    const moves = [];
    const mergeCells = new Set();
    let gained = 0;

    for (let index = 0; index < size; index += 1) {
      const cells = lineCells(direction, index);
      const tiles = cells
        .map((cell) => ({ ...cell, value: board[cell.row][cell.col] }))
        .filter((cell) => cell.value);
      let target = 0;

      for (let tileIndex = 0; tileIndex < tiles.length; tileIndex += 1) {
        const current = tiles[tileIndex];
        const destination = cells[target];
        const neighbor = tiles[tileIndex + 1];
        if (neighbor && neighbor.value === current.value) {
          const mergedValue = current.value * 2;
          next[destination.row][destination.col] = mergedValue;
          gained += mergedValue;
          mergeCells.add(`${destination.row}-${destination.col}`);
          moves.push({ value: current.value, from: current, to: destination });
          moves.push({ value: neighbor.value, from: neighbor, to: destination });
          tileIndex += 1;
        } else {
          next[destination.row][destination.col] = current.value;
          moves.push({ value: current.value, from: current, to: destination });
        }
        target += 1;
      }
    }

    return {
      changed: JSON.stringify(next) !== JSON.stringify(board),
      gained,
      mergeCells,
      moves,
      next
    };
  }

  function animateMoves(moves) {
    tileLayer.replaceChildren();
    moves.forEach((moveItem) => {
      const tile = createTile(moveItem.value, moveItem.from.row, moveItem.from.col, "no-transition");
      tileLayer.appendChild(tile);
      tile.getBoundingClientRect();
      tile.classList.remove("no-transition");
      positionTile(tile, moveItem.to.row, moveItem.to.col);
    });
  }

  function move(direction) {
    if (gameOver || animating) return;
    const planned = buildMove(direction);
    if (!planned.changed) return;

    animating = true;
    messageElement.hidden = true;
    animateMoves(planned.moves);
    score += planned.gained;
    if (score > best) {
      best = score;
      writeBest(best);
    }
    updateScores();

    window.setTimeout(() => {
      board = planned.next;
      const spawned = addRandomTile();
      renderTiles(spawned, planned.mergeCells, true);
      animating = false;
      updateState();
    }, moveDuration);
  }

  function updateState() {
    if (!won && board.some((row) => row.includes(2048))) {
      won = true;
      showMessage("2048", "You reached 2048. Keep going, or start a new game.", false);
      return;
    }
    if (!canMove()) {
      gameOver = true;
      showMessage("Game over", "No more moves remain.", true);
    }
  }

  function canMove() {
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (board[row][col] === 0) return true;
        if (col < size - 1 && board[row][col] === board[row][col + 1]) return true;
        if (row < size - 1 && board[row][col] === board[row + 1][col]) return true;
      }
    }
    return false;
  }

  function showMessage(title, text, restartOnly) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    messageButton.textContent = restartOnly ? "New game" : "Continue";
    messageElement.hidden = false;
  }

  const keyMap = {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left",
    w: "up",
    d: "right",
    s: "down",
    a: "left",
    W: "up",
    D: "right",
    S: "down",
    A: "left"
  };

  document.addEventListener("keydown", (event) => {
    const direction = keyMap[event.key];
    if (!direction) return;
    const target = event.target;
    if (target instanceof Element && target.closest("input, textarea, select, .site-nav, .nav-tools")) return;
    event.preventDefault();
    move(direction);
  });

  boardElement.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    touchStart = { x: event.clientX, y: event.clientY };
  });

  boardElement.addEventListener("pointerup", (event) => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < 24) return;
    move(absX > absY ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });

  boardElement.addEventListener("pointercancel", () => {
    touchStart = null;
  });

  newGameButton.addEventListener("click", startGame);
  messageButton.addEventListener("click", () => {
    if (gameOver) startGame();
    else messageElement.hidden = true;
  });

  startGame();
})();
