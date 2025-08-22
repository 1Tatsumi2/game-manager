import { promises as fs } from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "games.json");

// Utility function to read games from file
async function readGames() {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading games file:", error);
    return [];
  }
}

// Utility function to write games to file
async function writeGames(games: any[]) {
  try {
    await fs.writeFile(filePath, JSON.stringify(games, null, 2));
  } catch (error) {
    console.error("Error writing games file:", error);
    throw error;
  }
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  try {
    // GET - Get all games or single game by ID
    if (method === "GET") {
      const query = getQuery(event);
      const games = await readGames();

      if (query.id) {
        const game = games.find((g: any) => g.id === query.id);
        if (!game) {
          throw createError({
            statusCode: 404,
            statusMessage: "Game not found",
          });
        }
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

      // Generate new ID
      const newId = (
        Math.max(...games.map((g: any) => parseInt(g.id)), 0) + 1
      ).toString();

      const newGame = {
        id: newId,
        ...body,
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
