"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (color) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorColor: color }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      sessionStorage.setItem(`chess:${data.id}`, data.color);
      router.push(`/game/${data.id}`);
    } catch (err) {
      setError(err.message || "Failed to create game");
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = joinId.trim().toUpperCase();
    if (code.length < 4) { setError("Enter a valid game code."); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/games/${code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      sessionStorage.setItem(`chess:${code}`, data.color);
      router.push(`/game/${code}`);
    } catch (err) {
      setError(err.message || "Game not found");
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "0 16px",
    }}>
      <div style={{ fontSize: 56, marginTop: 72, color: "var(--gold)", textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
        ♔
      </div>
      <h1 style={{ fontSize: 38, fontWeight: 700, color: "var(--gold)", letterSpacing: 4, marginTop: 8 }}>
        CHESS
      </h1>
      <p className="mono" style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: 6, textTransform: "uppercase", marginTop: 8, marginBottom: 48 }}>
        Asynchronous Play
      </p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {/* Create */}
        <div className="card" style={{ width: 280, textAlign: "center" }}>
          <div style={{ fontSize: 20, color: "var(--gold)", marginBottom: 8 }}>New Game</div>
          <p className="mono" style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
            Pick your side — share the code with your opponent.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn btn-accent" onClick={() => handleCreate("w")} disabled={loading}>
              ♔ White
            </button>
            <button className="btn" onClick={() => handleCreate("b")} disabled={loading}>
              ♚ Black
            </button>
          </div>
        </div>

        {/* Join */}
        <div className="card" style={{ width: 280, textAlign: "center" }}>
          <div style={{ fontSize: 20, color: "var(--gold)", marginBottom: 8 }}>Join Game</div>
          <p className="mono" style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
            Enter the 6-character code from your opponent.
          </p>
          <input
            className="game-input"
            value={joinId}
            onChange={(e) => { setJoinId(e.target.value.toUpperCase()); setError(""); }}
            placeholder="ABC123"
            maxLength={6}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-accent" onClick={handleJoin} disabled={loading}>
              {loading ? "Joining..." : "Join"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mono" style={{ marginTop: 20, color: "var(--red)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <p className="mono" style={{
        marginTop: 48, color: "var(--text-dim)", fontSize: 11,
        maxWidth: 420, textAlign: "center", lineHeight: 1.8,
      }}>
        Create a game, text the code to your opponent, and play at your own pace.
        Full rules — castling, en passant, promotion, checkmate & stalemate.
        Games expire after 7 days of inactivity.
      </p>
    </main>
  );
}
