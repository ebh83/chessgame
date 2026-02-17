// ─── Chess Engine ───────────────────────────────────────────────────────────
// Pure logic, no dependencies. Shared between client and API routes.

export const PIECES = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

export const COLS = "abcdefgh";

export function initialBoard() {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  const back = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  for (let c = 0; c < 8; c++) {
    b[0][c] = back[c].toLowerCase();
    b[1][c] = "p";
    b[6][c] = "P";
    b[7][c] = back[c];
  }
  return b;
}

export const isWhite = (p) => p && p === p.toUpperCase();
export const isBlack = (p) => p && p === p.toLowerCase();
const sameColor = (a, b) => (isWhite(a) && isWhite(b)) || (isBlack(a) && isBlack(b));
const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const copyBoard = (b) => b.map((row) => [...row]);

export function isSquareAttacked(board, r, c, byWhite) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const p = board[row][col];
      if (!p) continue;
      if (byWhite ? !isWhite(p) : !isBlack(p)) continue;
      const type = p.toUpperCase();
      const dr = r - row, dc = c - col;
      const adr = Math.abs(dr), adc = Math.abs(dc);
      if (type === "P") {
        const dir = isWhite(p) ? -1 : 1;
        if (row + dir === r && adc === 1) return true;
      }
      if (type === "N" && ((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) return true;
      if (type === "K" && adr <= 1 && adc <= 1 && adr + adc > 0) return true;
      if ((type === "R" || type === "Q") && (dr === 0 || dc === 0) && adr + adc > 0) {
        const sr = dr === 0 ? 0 : dr / adr, sc = dc === 0 ? 0 : dc / adc;
        let tr = row + sr, tc = col + sc, blocked = false;
        while (tr !== r || tc !== c) {
          if (board[tr][tc]) { blocked = true; break; }
          tr += sr; tc += sc;
        }
        if (!blocked) return true;
      }
      if ((type === "B" || type === "Q") && adr === adc && adr > 0) {
        const sr = dr / adr, sc = dc / adc;
        let tr = row + sr, tc = col + sc, blocked = false;
        while (tr !== r || tc !== c) {
          if (board[tr][tc]) { blocked = true; break; }
          tr += sr; tc += sc;
        }
        if (!blocked) return true;
      }
    }
  }
  return false;
}

function getRawMoves(board, r, c, enPassant, castling) {
  const piece = board[r][c];
  if (!piece) return [];
  const moves = [];
  const white = isWhite(piece);
  const type = piece.toUpperCase();
  const dir = white ? -1 : 1;
  const isEmpty = (tr, tc) => inBounds(tr, tc) && !board[tr][tc];
  const canCapture = (tr, tc) => inBounds(tr, tc) && board[tr][tc] && !sameColor(piece, board[tr][tc]);

  if (type === "P") {
    if (isEmpty(r + dir, c)) {
      moves.push([r + dir, c]);
      const startRow = white ? 6 : 1;
      if (r === startRow && isEmpty(r + 2 * dir, c)) moves.push([r + 2 * dir, c]);
    }
    for (const dc of [-1, 1]) {
      if (canCapture(r + dir, c + dc)) moves.push([r + dir, c + dc]);
      if (enPassant && enPassant[0] === r + dir && enPassant[1] === c + dc)
        moves.push([r + dir, c + dc]);
    }
  }

  const slides = (dirs) => {
    for (const [dr, dc] of dirs) {
      let tr = r + dr, tc = c + dc;
      while (inBounds(tr, tc)) {
        if (board[tr][tc]) { if (!sameColor(piece, board[tr][tc])) moves.push([tr, tc]); break; }
        moves.push([tr, tc]); tr += dr; tc += dc;
      }
    }
  };

  const jumps = (offsets) => {
    for (const [dr, dc] of offsets) {
      const tr = r + dr, tc = c + dc;
      if (inBounds(tr, tc) && !sameColor(piece, board[tr][tc])) moves.push([tr, tc]);
    }
  };

  if (type === "R" || type === "Q") slides([[1, 0], [-1, 0], [0, 1], [0, -1]]);
  if (type === "B" || type === "Q") slides([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  if (type === "N") jumps([[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]);

  if (type === "K") {
    jumps([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
    if (castling) {
      const row = white ? 7 : 0;
      const side = white ? "w" : "b";
      if (r === row && c === 4) {
        if (castling[side + "k"] && !board[row][5] && !board[row][6] &&
          board[row][7]?.toUpperCase() === "R" && sameColor(piece, board[row][7])) {
          if (!isSquareAttacked(board, row, 4, !white) &&
            !isSquareAttacked(board, row, 5, !white) &&
            !isSquareAttacked(board, row, 6, !white))
            moves.push([row, 6]);
        }
        if (castling[side + "q"] && !board[row][3] && !board[row][2] && !board[row][1] &&
          board[row][0]?.toUpperCase() === "R" && sameColor(piece, board[row][0])) {
          if (!isSquareAttacked(board, row, 4, !white) &&
            !isSquareAttacked(board, row, 3, !white) &&
            !isSquareAttacked(board, row, 2, !white))
            moves.push([row, 2]);
        }
      }
    }
  }

  return moves;
}

export function isInCheck(board, white) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === (white ? "K" : "k"))
        return isSquareAttacked(board, r, c, !white);
  return false;
}

export function getLegalMoves(board, r, c, enPassant, castling) {
  const piece = board[r][c];
  if (!piece) return [];
  const white = isWhite(piece);
  return getRawMoves(board, r, c, enPassant, castling).filter(([tr, tc]) => {
    const nb = copyBoard(board);
    if (piece.toUpperCase() === "P" && enPassant && tr === enPassant[0] && tc === enPassant[1])
      nb[r][tc] = null;
    nb[tr][tc] = nb[r][c];
    nb[r][c] = null;
    return !isInCheck(nb, white);
  });
}

export function hasAnyLegalMoves(board, white, enPassant, castling) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || (white ? !isWhite(p) : !isBlack(p))) continue;
      if (getLegalMoves(board, r, c, enPassant, castling).length > 0) return true;
    }
  return false;
}

function toNotation(fromR, fromC, toR, toC, piece, isCapture, isCastleK, isCastleQ) {
  if (isCastleK) return "O-O";
  if (isCastleQ) return "O-O-O";
  const type = piece.toUpperCase();
  const dest = COLS[toC] + (8 - toR);
  if (type === "P") return (isCapture ? COLS[fromC] + "x" : "") + dest;
  return type + (isCapture ? "x" : "") + dest;
}

export function makeMove(state, fromR, fromC, toR, toC, promoteTo) {
  const board = copyBoard(state.board);
  const piece = board[fromR][fromC];
  const white = isWhite(piece);
  let newEnPassant = null;
  const castling = { ...state.castling };
  const captured = board[toR][toC];
  const isCapture = !!captured ||
    (piece.toUpperCase() === "P" && state.enPassant &&
      toR === state.enPassant[0] && toC === state.enPassant[1]);
  const isCastleK = piece.toUpperCase() === "K" && toC - fromC === 2;
  const isCastleQ = piece.toUpperCase() === "K" && fromC - toC === 2;

  if (piece.toUpperCase() === "P" && state.enPassant &&
    toR === state.enPassant[0] && toC === state.enPassant[1])
    board[fromR][toC] = null;

  if (isCastleK) { board[fromR][5] = board[fromR][7]; board[fromR][7] = null; }
  if (isCastleQ) { board[fromR][3] = board[fromR][0]; board[fromR][0] = null; }

  board[toR][toC] = piece;
  board[fromR][fromC] = null;

  if (piece.toUpperCase() === "P" && (toR === 0 || toR === 7)) {
    board[toR][toC] = white ? (promoteTo || "Q") : (promoteTo || "Q").toLowerCase();
  }

  if (piece.toUpperCase() === "P" && Math.abs(toR - fromR) === 2)
    newEnPassant = [(fromR + toR) / 2, fromC];

  if (piece === "K") { castling.wk = false; castling.wq = false; }
  if (piece === "k") { castling.bk = false; castling.bq = false; }
  if (fromR === 7 && fromC === 7) castling.wk = false;
  if (fromR === 7 && fromC === 0) castling.wq = false;
  if (fromR === 0 && fromC === 7) castling.bk = false;
  if (fromR === 0 && fromC === 0) castling.bq = false;
  if (toR === 7 && toC === 7) castling.wk = false;
  if (toR === 7 && toC === 0) castling.wq = false;
  if (toR === 0 && toC === 7) castling.bk = false;
  if (toR === 0 && toC === 0) castling.bq = false;

  const nextWhite = !white;
  const inCheck = isInCheck(board, nextWhite);
  const hasLegal = hasAnyLegalMoves(board, nextWhite, newEnPassant, castling);
  let status = "playing";
  if (!hasLegal) status = inCheck ? (nextWhite ? "black_wins" : "white_wins") : "stalemate";

  const notation = toNotation(fromR, fromC, toR, toC, piece, isCapture, isCastleK, isCastleQ) +
    (promoteTo ? "=" + promoteTo : "") +
    (status.includes("wins") ? "#" : inCheck ? "+" : "");

  return {
    board, turn: nextWhite ? "w" : "b", enPassant: newEnPassant, castling, status,
    lastMove: { from: [fromR, fromC], to: [toR, toC] },
    moveCount: (state.moveCount || 0) + 1,
    moveHistory: [...(state.moveHistory || []), notation],
    capturedWhite: [...(state.capturedWhite || []),
      ...(captured && isBlack(captured) ? [captured] : [])],
    capturedBlack: [...(state.capturedBlack || []),
      ...(captured && isWhite(captured) ? [captured] : [])],
  };
}

export function newGameState() {
  return {
    board: initialBoard(),
    turn: "w",
    enPassant: null,
    castling: { wk: true, wq: true, bk: true, bq: true },
    status: "playing",
    lastMove: null,
    moveCount: 0,
    moveHistory: [],
    capturedWhite: [],
    capturedBlack: [],
  };
}
