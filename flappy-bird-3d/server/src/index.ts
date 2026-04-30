import { Hono } from "hono";
import { db } from "edgespark";
import { scores } from "@defs";
import { desc, eq } from "drizzle-orm";

const VALID_DIFFICULTIES = ["rookie", "normal", "master"];

const app = new Hono()
  // Get leaderboard filtered by difficulty
  .get("/api/public/leaderboard", async (c) => {
    const difficulty = c.req.query("difficulty") || "rookie";
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return c.json({ error: "Invalid difficulty" }, 400);
    }

    const topScores = await db
      .select()
      .from(scores)
      .where(eq(scores.difficulty, difficulty))
      .orderBy(desc(scores.score))
      .limit(20);
    return c.json({ leaderboard: topScores });
  })

  // Submit score
  .post("/api/public/scores", async (c) => {
    const { player_name, score, difficulty } = await c.req.json();

    if (!player_name || typeof player_name !== "string" || player_name.trim().length === 0) {
      return c.json({ error: "player_name is required" }, 400);
    }
    if (typeof score !== "number" || score < 0 || !Number.isInteger(score)) {
      return c.json({ error: "score must be a non-negative integer" }, 400);
    }
    const diff = typeof difficulty === "string" && VALID_DIFFICULTIES.includes(difficulty)
      ? difficulty
      : "rookie";

    const [inserted] = await db
      .insert(scores)
      .values({
        player_name: player_name.trim().slice(0, 20),
        score,
        difficulty: diff,
      })
      .returning();

    return c.json({ success: true, entry: inserted }, 201);
  });

export default app;
