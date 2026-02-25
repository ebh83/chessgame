"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const createGame = async (color) => {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorColor: color }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setCreating(false); return; }
      sessionStorage.setItem(`chess:${data.id}`, data.color);
      router.push(`/game/${data.id}`);
    } catch {
      setError("Failed to create game");
      setCreating(false);
    }
  };

  const joinGame = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    router.push(`/game/${code}`);
  };

  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "0 var(--page-pad)", gap: 40,
    }}>
      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, color: "var(--gold)", marginBottom: 8 }}>♔</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--gold)", letterSpacing: 2 }}>
          Chess
        </h1>
        <p className="mono" style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
          Async online play
        </p>
      </div>

      {/* Create Game */}
      <div className="card" style={{ textAlign: "center", maxWidth: 360, width: "100%" }}>
        <div style={{ fontSize: 18, color: "var(--gold)", marginBottom: 20 }}>
          New Game
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="btn btn-accent"
            disabled={creating}
            onClick={() => createGame("w")}
          >
            Play as White ♔
          </button>
          <button
            className="btn"
            disabled={creating}
            onClick={() => createGame("b")}
          >
            Play as Black ♚
          </button>
        </div>
      </div>

      {/* Join Game */}
      <div className="card" style={{ textAlign: "center", maxWidth: 360, width: "100%" }}>
        <div style={{ fontSize: 18, color: "var(--gold)", marginBottom: 20 }}>
          Join Game
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="game-input"
            type="text"
            placeholder="CODE"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && joinGame()}
          />
          <button className="btn" onClick={joinGame} disabled={!joinCode.trim()}>
            Join
          </button>
        </div>
      </div>

      {error && (
        <div className="mono" style={{ color: "var(--red)", fontSize: 13 }}>
          {error}
        </div>
      )}
    </main>
  );
}
