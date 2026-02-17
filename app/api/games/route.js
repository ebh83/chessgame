import { kv } from "@vercel/kv";
import { newGameState } from "@/lib/chess";

function generateId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function POST(request) {
  try {
    const { creatorColor } = await request.json();
    const color = creatorColor === "b" ? "b" : "w";

    let id;
    for (let i = 0; i < 5; i++) {
      id = generateId();
      const existing = await kv.get(`game:${id}`);
      if (!existing) break;
    }

    const game = {
      ...newGameState(),
      id,
      creatorColor: color,
      players: { [color]: true },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await kv.set(`game:${id}`, game, { ex: 604800 });

    return Response.json({ id, color });
  } catch (err) {
    console.error("Create game error:", err);
    return Response.json({ error: "Failed to create game" }, { status: 500 });
  }
}
