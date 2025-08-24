import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// In-memory store for production environment
let memoryStore: any[] | null = null;

// Try several paths because Vercel / Nitro build output can change the runtime cwd
const fallbackPaths = (() => {
  const fromCwd = (p: string) => path.join(process.cwd(), p);
  const fromThisFile = () =>
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "..",
      "data",
      "games.json"
    );

  return [
    fromCwd("data/games.json"),
    fromCwd("public/data/games.json"),
    fromCwd("public/games.json"),
    fromCwd(".output/server/data/games.json"),
    fromCwd(".output/public/data/games.json"),
    fromCwd(".output/public/games.json"),
    fromThisFile(),
    // Additional Vercel-specific paths
    "/var/task/public/data/games.json",
    "/var/task/public/games.json",
    "/tmp/games.json",
  ];
})();

// Utility function to read games from file or bundled JSON. Returns [] on failure.
async function readGames() {
  // First, try dynamic import of the bundled JSON (most reliable on Vercel)
  try {
    // @ts-ignore - Node supports JSON imports in newer versions/bundlers
    const mod = await import("../../data/games.json", {
      assert: { type: "json" },
    });
    const gamesFromBundle = (mod && (mod.default || mod)) || [];

    console.log(
      "Successfully loaded games from bundled JSON:",
      gamesFromBundle.length,
      "games"
    );

    // In production, merge with memory store if it has additional games
    if (process.env.NODE_ENV === "production") {
      if (memoryStore !== null && memoryStore.length > gamesFromBundle.length) {
        console.log("Using memory store (has more games):", memoryStore.length);
        return memoryStore;
      } else {
        // Initialize/update memory store with bundled data
        memoryStore = [...gamesFromBundle];
        console.log("Initialized memory store from bundle");
        return gamesFromBundle;
      }
    }

    return gamesFromBundle;
  } catch (bundleErr) {
    console.error("Failed to import bundled JSON:", bundleErr);
  }

  // Fallback: In production, use memory store if available
  if (process.env.NODE_ENV === "production" && memoryStore !== null) {
    console.log(
      "Using existing memory store as fallback:",
      memoryStore.length,
      "games"
    );
    return memoryStore;
  }

  // Try fs read on multiple candidate locations (development)
  for (const p of fallbackPaths) {
    try {
      const data = await fs.readFile(p, "utf-8");
      const games = JSON.parse(data);
      console.log(
        "Successfully read games from file:",
        p,
        "->",
        games.length,
        "games"
      );

      // Initialize memory store in production
      if (process.env.NODE_ENV === "production" && memoryStore === null) {
        memoryStore = [...games];
      }

      return games;
    } catch (e) {
      // ignore and try next
    }
  }

  console.error("Error reading games file (all attempts failed)");

  // Return empty array or memory store as last fallback
  if (process.env.NODE_ENV === "production" && memoryStore !== null) {
    return memoryStore;
  }

  return [];
}

// Utility function to write games to file
async function writeGames(games: any[]) {
  // In production, update memory store
  if (process.env.NODE_ENV === "production") {
    memoryStore = [...games];
    console.log("Updated in-memory store with", games.length, "games");
    return;
  }

  // In development, try to write to the most likely location
  for (const p of fallbackPaths) {
    try {
      await fs.writeFile(p, JSON.stringify(games, null, 2));
      console.log(`Successfully wrote games to: ${p}`);
      return;
    } catch (e: any) {
      console.log(`Failed to write to ${p}:`, e?.message || e);
      // ignore and try next
    }
  }

  // If all attempts failed in development, throw
  throw new Error("Unable to write games file to disk");
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  try {
    // GET - Get all games or single game by ID
    if (method === "GET") {
      const query = getQuery(event);
      const games = await readGames();

      console.log("GET request - games loaded:", games.length, "total games");

      if (query.id) {
        console.log("Looking for game with ID:", query.id);
        const game = games.find((g: any) => g.id === query.id);
        if (!game) {
          console.error("Game not found with ID:", query.id);
          console.log(
            "Available game IDs:",
            games.map((g: any) => g.id)
          );
          throw createError({
            statusCode: 404,
            statusMessage: "Game not found",
          });
        }
        console.log("Found game:", game.id, "->", game.names);
        return game;
      }

      // Apply filters
      let filteredGames = games;

      if (query.category) {
        filteredGames = filteredGames.filter((g: any) =>
          g.category
            .toLowerCase()
            .includes((query.category as string).toLowerCase())
        );
      }

      if (query.search) {
        const searchTerm = (query.search as string).toLowerCase();
        filteredGames = filteredGames.filter(
          (g: any) =>
            Object.values(g.names || {}).some((name: any) =>
              name.toLowerCase().includes(searchTerm)
            ) || g.description.toLowerCase().includes(searchTerm)
        );
      }

      // Apply pagination
      const page = parseInt((query.page as string) || "1");
      const limit = parseInt((query.limit as string) || "10");
      const offset = (page - 1) * limit;

      const total = filteredGames.length;
      const paginatedGames = filteredGames.slice(offset, offset + limit);

      return {
        games: paginatedGames,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // POST - Create new game
    if (method === "POST") {
      const body = await readBody(event);
      const games = await readGames();

      // Generate new ID - handle case when games array is empty
      let newId: string;
      if (games.length === 0) {
        newId = "1";
      } else {
        // Try to find numeric IDs, fallback to timestamp-based ID
        const numericIds = games
          .map((g: any) => parseInt(g.id))
          .filter((id: number) => !isNaN(id));

        if (numericIds.length > 0) {
          newId = (Math.max(...numericIds) + 1).toString();
        } else {
          // If no numeric IDs found, use the body.id or generate timestamp-based ID
          newId = body.id || `GAME_${Date.now()}`;
        }
      }

      const newGame = {
        ...body,
        id: body.id || newId, // Use provided ID or generated ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      games.push(newGame);
      await writeGames(games);

      return { success: true, game: newGame };
    }

    // PUT - Update existing game
    if (method === "PUT") {
      const body = await readBody(event);
      const games = await readGames();

      const gameIndex = games.findIndex((g: any) => g.id === body.id);
      if (gameIndex === -1) {
        throw createError({
          statusCode: 404,
          statusMessage: "Game not found",
        });
      }

      games[gameIndex] = {
        ...games[gameIndex],
        ...body,
        updatedAt: new Date().toISOString(),
      };

      await writeGames(games);

      return { success: true, game: games[gameIndex] };
    }

    // DELETE - Delete game(s)
    if (method === "DELETE") {
      const body = await readBody(event);
      const games = await readGames();

      if (body.ids && Array.isArray(body.ids)) {
        // Bulk delete
        const updatedGames = games.filter((g: any) => !body.ids.includes(g.id));
        await writeGames(updatedGames);
        return {
          success: true,
          deletedCount: games.length - updatedGames.length,
        };
      } else if (body.id) {
        // Single delete
        const updatedGames = games.filter((g: any) => g.id !== body.id);
        if (updatedGames.length === games.length) {
          throw createError({
            statusCode: 404,
            statusMessage: "Game not found",
          });
        }
        await writeGames(updatedGames);
        return { success: true, deletedCount: 1 };
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: "Missing id or ids parameter",
        });
      }
    }
  } catch (error: any) {
    console.error("API Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
