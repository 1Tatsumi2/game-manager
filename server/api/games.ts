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
  console.log(
    "readGames() called, NODE_ENV:",
    process.env.NODE_ENV,
    "memoryStore length:",
    memoryStore?.length || 0
  );

  // Always try to load bundled JSON first
  let bundledGames: any[] = [];
  try {
    // @ts-ignore - Node supports JSON imports in newer versions/bundlers
    const mod = await import("../../data/games.json", {
      assert: { type: "json" },
    });
    bundledGames = (mod && (mod.default || mod)) || [];
    console.log(
      "Successfully loaded games from bundled JSON:",
      bundledGames.length,
      "games"
    );
  } catch (bundleErr) {
    console.error("Failed to import bundled JSON:", bundleErr);
  }

  // In production, prioritize memory store if it has more recent data
  if (process.env.NODE_ENV === "production") {
    if (memoryStore !== null && memoryStore.length > 0) {
      console.log("Using memory store data:", memoryStore.length, "games");
      return memoryStore;
    }
    console.log(
      "Memory store empty, using bundled data:",
      bundledGames.length,
      "games"
    );
    // Initialize memory store with bundled data
    memoryStore = bundledGames;
    return bundledGames;
  }

  // In development, return bundled data directly
  return bundledGames;
}

// Utility function to write games to file
async function writeGames(games: any[]) {
  console.log(
    "writeGames() called with",
    games.length,
    "games, NODE_ENV:",
    process.env.NODE_ENV
  );

  // In production, update memory store
  if (process.env.NODE_ENV === "production") {
    memoryStore = [...games];
    console.log("Updated in-memory store with", games.length, "games");
    console.log(
      "Memory store game IDs:",
      memoryStore.map((g: any) => g.id)
    );
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
      console.log("POST - Creating new game:", body.id || "no ID provided");

      const games = await readGames();
      console.log(
        "POST - Current games before create:",
        games.map((g: any) => g.id)
      );

      // Generate new ID - handle case when games array is empty
      let newId: string;
      if (games.length === 0) {
        newId = "1";
        console.log("POST - Using ID '1' for first game");
      } else {
        // Try to find numeric IDs, fallback to timestamp-based ID
        const numericIds = games
          .map((g: any) => parseInt(g.id))
          .filter((id: number) => !isNaN(id));

        if (numericIds.length > 0) {
          newId = (Math.max(...numericIds) + 1).toString();
          console.log("POST - Generated numeric ID:", newId);
        } else {
          // If no numeric IDs found, use the body.id or generate timestamp-based ID
          newId = body.id || `GAME_${Date.now()}`;
          console.log("POST - Using custom/timestamp ID:", newId);
        }
      }

      const finalId = body.id || newId;
      console.log("POST - Final game ID:", finalId);

      // Check for duplicate ID
      if (games.find((g: any) => g.id === finalId)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Game with ID '${finalId}' already exists`,
        });
      }

      const newGame = {
        ...body,
        id: finalId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      games.push(newGame);
      await writeGames(games);

      console.log("POST - Game created successfully:", finalId);
      return { success: true, game: newGame };
    }

    // PUT - Update existing game
    if (method === "PUT") {
      const body = await readBody(event);
      console.log("PUT - Updating game:", body.id);

      const games = await readGames();
      console.log(
        "PUT - Current games before update:",
        games.map((g: any) => g.id)
      );

      const gameIndex = games.findIndex((g: any) => g.id === body.id);
      if (gameIndex === -1) {
        console.error("PUT - Game not found:", body.id);
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

      console.log("PUT - Game updated successfully:", body.id);
      return { success: true, game: games[gameIndex] };
    }

    // DELETE - Delete game(s)
    if (method === "DELETE") {
      const body = await readBody(event);
      console.log("DELETE - Request:", body);

      const games = await readGames();
      console.log(
        "DELETE - Current games before delete:",
        games.map((g: any) => g.id)
      );

      if (body.ids && Array.isArray(body.ids)) {
        // Bulk delete
        console.log("DELETE - Bulk delete IDs:", body.ids);

        const filteredGames = games.filter(
          (g: any) => !body.ids.includes(g.id)
        );
        await writeGames(filteredGames);
        console.log(
          "DELETE - Bulk delete completed, remaining games:",
          filteredGames.map((g: any) => g.id)
        );
        return {
          success: true,
          deletedCount: games.length - filteredGames.length,
        };
      } else if (body.id) {
        // Single delete
        console.log("DELETE - Single delete ID:", body.id);

        const filteredGames = games.filter((g: any) => g.id !== body.id);
        if (filteredGames.length === games.length) {
          console.error("DELETE - Game not found:", body.id);
          throw createError({
            statusCode: 404,
            statusMessage: "Game not found",
          });
        }
        await writeGames(filteredGames);
        console.log(
          "DELETE - Single delete completed, remaining games:",
          filteredGames.map((g: any) => g.id)
        );
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
