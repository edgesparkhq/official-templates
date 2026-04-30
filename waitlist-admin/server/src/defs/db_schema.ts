import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const signups = sqliteTable(
  "signups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    source: text("source").default("landing"),
    created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => [
    index("signups_created_at_idx").on(table.created_at),
  ]
);
