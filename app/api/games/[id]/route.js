import { kv } from "@vercel/kv";
import { makeMove, getLegalMoves, isWhite, isBlack } from "@/lib/chess";

async function getGame(id) {
  const data = await kv.get(`game:${id}`);
  return data || null;
}

async function saveGame(id, game) {
  game.updatedAt = Date.now();
  await kv.set(`game:${id}`, game, { ex: 604800 });
}

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const game = await getGame(id.toUpperCase());
    if (!game) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }
    return Response.json(game, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("Get game error:", err);
    return Response.json({ error: "Failed to fetch game" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const game = await getGame(id.toUpperCase());

    if (!game) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    // Join game
    if (body.action === "join") {
      const takenColor = game.creatorColor;
      const joinColor = takenColor === "w" ? "b" : "w";

      if (game.players[joinColor]) {
        return Response.json({ error: "Game is full" }, { status: 400 });
      }

      game.players[joinColor] = true;
      await saveGame(id.toUpperCase(), game);
      return Response.json({ color: joinColor, game });
    }

    // Make a move
    if (body.action === "move") {
      const { fromR, fromC, toR, toC, promoteTo, playerColor } = body;

      if (game.status !== "playing") {
        return Response.json({ error: "Game is over" }, { status: 400 });
      }
      if (game.turn !== playerColor) {
        return Response.json({ error: "Not your turn" }, { status: 400 });
      }

      const piece = game.board[fromR][fromC];
      if (!piece) {
        return Response.json({ error: "No piece at source" }, { status: 400 });
      }
      if (playerColor === "w" && !isWhite(piece)) {
        return Response.json({ error: "Not your piece" }, { status: 400 });
      }
      if (playerColor === "b" && !isBlack(piece)) {
        return Response.json({ error: "Not your piece" }, { status: 400 });
      }

      const legal = getLegalMoves(game.board, fromR, fromC, game.enPassant, game.castling);
      const isLegal = legal.some(([mr, mc]) => mr === toR && mc === toC);
      if (!isLegal) {
        return Response.json({ error: "Illegal move" }, { status: 400 });
      }

      const newState = makeMove(game, fromR, fromC, toR, toC, promoteTo);

      const updatedGame = {
        ...game,
        ...newState,
        players: game.players,
        creatorColor: game.creatorColor,
        createdAt: game.createdAt,
      };

      await saveGame(id.toUpperCase(), updatedGame);
      return Response.json(updatedGame);
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Update game error:", err);
    return Response.json({ error: "Failed to update game" }, { status: 500 });
  }
}

