import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const scores = sqliteTable("scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  player_name: text("player_name").notNull(),
  score: integer("score").notNull(),
  difficulty: text("difficulty").notNull().default("rookie"),
  created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
});
