"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PIECES, COLS, isWhite, isBlack, isInCheck,
  getLegalMoves,
} from "@/lib/chess";

// ─── Promotion Modal ────────────────────────────────────────────────────────

function PromotionModal({ white, onSelect }) {
  const pieces = white ? ["Q", "R", "B", "N"] : ["q", "r", "b", "n"];
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div style={{ color: "var(--gold)", fontSize: 18, marginBottom: 16, textAlign: "center" }}>
          Promote Pawn
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {pieces.map((p) => (
            <button
              key={p}
              className="promo-btn"
              onClick={() => onSelect(p.toUpperCase())}
              style={{ color: isWhite(p) ? "#f0e6d2" : "#3a2a1a" }}
            >
              {PIECES[p]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Captured Pieces ────────────────────────────────────────────────────────

function CapturedPieces({ pieces }) {
  if (!pieces || pieces.length === 0) return <div style={{ minHeight: 22 }} />;
  const order = { Q: 0, R: 1, B: 2, N: 3, P: 4, q: 0, r: 1, b: 2, n: 3, p: 4 };
  const sorted = [...pieces].sort((a, b) => order[a] - order[b]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 1, minHeight: 22 }}>
      {sorted.map((p, i) => (
        <span key={i} style={{ fontSize: 16, opacity: 0.65 }} className={isWhite(p) ? "piece-white" : "piece-black"}>
          {PIECES[p]}
        </span>
      ))}
    </div>
  );
}

// ─── Move History ───────────────────────────────────────────────────────────

function MoveHistory({ moves }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [moves]);
  if (!moves || moves.length === 0) return null;
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2)
    pairs.push({ num: Math.floor(i / 2) + 1, w: moves[i], b: moves[i + 1] || "" });
  return (
    <div ref={ref} className="move-history">
      {pairs.map((p, i) => (
        <div key={i} className="move-row">
          <span className="move-num">{p.num}.</span>
          <span className="move-white">{p.w}</span>
          <span className="move-black">{p.b}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Board ──────────────────────────────────────────────────────────────────

function Board({ game, myColor, onMove }) {
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [promotion, setPromotion] = useState(null);

  const flipped = myColor === "b";
  const isMyTurn = game.turn === myColor && game.status === "playing";

  useEffect(() => { setSelected(null); setLegalMoves([]); }, [game.turn, game.moveCount]);

  const handleClick = (r, c) => {
    if (!isMyTurn) return;
    const piece = game.board[r][c];

    if (selected) {
      const isLegal = legalMoves.some(([mr, mc]) => mr === r && mc === c);
      if (isLegal) {
        const movingPiece = game.board[selected[0]][selected[1]];
        if (movingPiece.toUpperCase() === "P" && (r === 0 || r === 7)) {
          setPromotion({ from: selected, to: [r, c] });
          setSelected(null); setLegalMoves([]);
          return;
        }
        onMove(selected[0], selected[1], r, c);
        setSelected(null); setLegalMoves([]);
        return;
      }
      if (piece && ((myColor === "w" && isWhite(piece)) || (myColor === "b" && isBlack(piece)))) {
        setSelected([r, c]);
        setLegalMoves(getLegalMoves(game.board, r, c, game.enPassant, game.castling));
        return;
      }
      setSelected(null); setLegalMoves([]);
      return;
    }

    if (piece && ((myColor === "w" && isWhite(piece)) || (myColor === "b" && isBlack(piece)))) {
      setSelected([r, c]);
      setLegalMoves(getLegalMoves(game.board, r, c, game.enPassant, game.castling));
    }
  };

  const handlePromotion = (promoteTo) => {
    onMove(promotion.from[0], promotion.from[1], promotion.to[0], promotion.to[1], promoteTo);
    setPromotion(null);
  };

  const rows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  const inCheck = game.status === "playing" && isInCheck(game.board, game.turn === "w");
  let kingPos = null;
  if (inCheck) {
    for (let rr = 0; rr < 8; rr++)
      for (let cc = 0; cc < 8; cc++)
        if (game.board[rr][cc] === (game.turn === "w" ? "K" : "k")) kingPos = [rr, cc];
  }

  return (
    <>
      {promotion && <PromotionModal white={myColor === "w"} onSelect={handlePromotion} />}
      <div className="board-container">
        <div style={{ display: "flex", paddingLeft: 28 }}>
          {cols.map((c) => (
            <div key={c} className="board-label" style={{ width: 68, textAlign: "center", padding: "3px 0" }}>
              {COLS[c]}
            </div>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r} style={{ display: "flex", alignItems: "center" }}>
            <div className="board-label" style={{ width: 28, textAlign: "center" }}>{8 - r}</div>
            {cols.map((c) => {
              const piece = game.board[r][c];
              const light = (r + c) % 2 === 0;
              const isSel = selected && selected[0] === r && selected[1] === c;
              const isLM = legalMoves.some(([mr, mc]) => mr === r && mc === c);
              const isLastFrom = game.lastMove?.from[0] === r && game.lastMove?.from[1] === c;
              const isLastTo = game.lastMove?.to[0] === r && game.lastMove?.to[1] === c;
              const isKC = kingPos && kingPos[0] === r && kingPos[1] === c;

              let bg = light ? "var(--sq-light)" : "var(--sq-dark)";
              if (isSel) bg = light ? "var(--sq-sel-light)" : "var(--sq-sel-dark)";
              else if (isLastFrom || isLastTo) bg = light ? "var(--sq-last-light)" : "var(--sq-last-dark)";
              if (isKC) bg = "#c44";

              return (
                <div
                  key={c}
                  className="square"
                  onClick={() => handleClick(r, c)}
                  style={{
                    background: bg,
                    cursor: isMyTurn ? "pointer" : "default",
                  }}
                >
                  {isLM && !piece && <div className="legal-dot" />}
                  {isLM && piece && <div className="legal-ring" />}
                  {piece && (
                    <span className={`piece ${isWhite(piece) ? "piece-white" : "piece-black"}`}>
                      {PIECES[piece]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Loading Dots ───────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <span>
      <span className="loading-dot" />{" "}
      <span className="loading-dot" />{" "}
      <span className="loading-dot" />
    </span>
  );
}

// ─── Game Page ──────────────────────────────────────────────────────────────

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id?.toUpperCase();

  const [game, setGame] = useState(null);
  const [myColor, setMyColor] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}`);
      if (!res.ok) { setError("Game not found"); setLoading(false); return; }
      const data = await res.json();
      setGame(data);
      setLoading(false);
    } catch {
      setError("Failed to load game");
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    const color = sessionStorage.getItem(`chess:${gameId}`);
    if (color) setMyColor(color);
    fetchGame();
  }, [gameId, fetchGame]);

  useEffect(() => {
    if (!game || game.status !== "playing") {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(fetchGame, 3000);
    return () => clearInterval(pollRef.current);
  }, [game?.status, game?.turn, myColor, fetchGame]);

  const handleMove = async (fromR, fromC, toR, toC, promoteTo) => {
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          fromR, fromC, toR, toC, promoteTo,
          playerColor: myColor,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setGame(data);
    } catch {
      setError("Failed to send move. Retrying...");
      setTimeout(fetchGame, 1000);
    }
  };

  const handleCopy = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--gold)", fontSize: 36, marginBottom: 16 }}>♔</div>
        <LoadingDots />
      </main>
    );
  }

  if (error && !game) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ color: "var(--red)", fontSize: 16 }}>{error}</div>
        <button className="btn" onClick={() => router.push("/")}>← Back to Home</button>
      </main>
    );
  }

  if (!game) return null;

  // ─── Join prompt for direct links ─────────────────────────────────────────

  if (!myColor && game.status === "playing") {
    const taken = game.creatorColor;
    const available = taken === "w" ? "b" : "w";
    const hasOpponent = game.players[available];

    if (!hasOpponent) {
      return (
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ fontSize: 36, color: "var(--gold)" }}>♔</div>
          <div style={{ fontSize: 20, color: "var(--gold)" }}>Join Game {gameId}?</div>
          <p className="mono" style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            You&apos;ll play as {available === "w" ? "White ♔" : "Black ♚"}
          </p>
          <button
            className="btn btn-accent"
            onClick={async () => {
              const res = await fetch(`/api/games/${gameId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "join" }),
              });
              const data = await res.json();
              if (data.color) {
                sessionStorage.setItem(`chess:${gameId}`, data.color);
                setMyColor(data.color);
                setGame(data.game);
              }
            }}
          >
            Join as {available === "w" ? "White" : "Black"}
          </button>
        </main>
      );
    }
  }

  // ─── Game UI ──────────────────────────────────────────────────────────────

  const myTurn = game.turn === myColor;
  const myLabel = myColor === "w" ? "White" : "Black";
  const turnLabel = game.turn === "w" ? "White" : "Black";
  const inCheck = game.status === "playing" && isInCheck(game.board, game.turn === "w");

  const statusMsg =
    game.status === "white_wins" ? "Checkmate — White wins!" :
    game.status === "black_wins" ? "Checkmate — Black wins!" :
    game.status === "stalemate" ? "Stalemate — Draw" :
    myTurn ? "Your move" : `Waiting for ${turnLabel}...`;

  const statusColor =
    game.status !== "playing" ? "var(--gold)" :
    myTurn ? (inCheck ? "var(--red)" : "var(--green)") :
    "var(--text-secondary)";

  const bothJoined = game.players?.w && game.players?.b;

  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "0 16px",
    }}>
      {/* Header */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "8px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>GAME</span>
          <span className="mono" style={{ fontSize: 18, color: "var(--gold)", letterSpacing: 3 }}>{gameId}</span>
          <button
            onClick={handleCopy}
            className="mono"
            style={{
              background: "none", border: "1px solid var(--border-light)", borderRadius: 4,
              color: copied ? "var(--green)" : "var(--text-secondary)",
              cursor: "pointer", padding: "2px 8px", fontSize: 11,
            }}
          >
            {copied ? "✓ Copied" : "Share Link"}
          </button>
        </div>

        {myColor && (
          <div style={{
            background: "var(--bg-secondary)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "8px 14px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>{myColor === "w" ? "♔" : "♚"}</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--gold)" }}>
              Playing as {myLabel}
            </span>
          </div>
        )}
      </div>

      {/* Waiting banner */}
      {!bothJoined && (
        <div style={{
          marginTop: 12, padding: "12px 24px", borderRadius: 8,
          background: "rgba(196,169,106,0.08)", border: "1px solid rgba(196,169,106,0.2)",
          textAlign: "center",
        }}>
          <span style={{ color: "var(--gold)", fontSize: 14 }}>
            Waiting for opponent to join <LoadingDots />
          </span>
          <div className="mono" style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 6 }}>
            Share the link or game code: <strong style={{ color: "var(--gold)" }}>{gameId}</strong>
          </div>
        </div>
      )}

      {/* Status */}
      {bothJoined && (
        <div className="status-bar" style={{ marginTop: 12 }}>
          <span style={{ fontSize: 15, color: statusColor, fontWeight: 600 }}>
            {statusMsg}
            {inCheck && myTurn && <span style={{ color: "var(--red)", marginLeft: 6 }}>— Check!</span>}
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
            Move {game.moveCount}
          </span>
          {!myTurn && game.status === "playing" && (
            <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
              Auto-refreshing <LoadingDots />
            </span>
          )}
        </div>
      )}

      {/* Captured (opponent) */}
      <div style={{ marginTop: 10 }}>
        <CapturedPieces pieces={myColor === "w" ? game.capturedBlack : game.capturedWhite} />
      </div>

      {/* Board */}
      <div style={{ marginTop: 6 }}>
        <Board game={game} myColor={myColor || "w"} onMove={handleMove} />
      </div>

      {/* Captured (mine) */}
      <div style={{ marginTop: 4 }}>
        <CapturedPieces pieces={myColor === "w" ? game.capturedWhite : game.capturedBlack} />
      </div>

      {/* Controls */}
      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn btn-sm" onClick={fetchGame}>↻ Refresh</button>
        <button className="btn btn-sm" onClick={() => router.push("/")}>← New Game</button>
      </div>

      {/* Move history */}
      <div style={{ marginTop: 14, marginBottom: 24 }}>
        <MoveHistory moves={game.moveHistory} />
      </div>

      {error && (
        <div className="mono" style={{ color: "var(--red)", fontSize: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}
    </main>
  );
}
