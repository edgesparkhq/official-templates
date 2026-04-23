import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const bounty_tasks = sqliteTable("bounty_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  cover_image: text("cover_image"),
  reward_amount: integer("reward_amount").notNull(),
  status: text("status", { enum: ["Open", "Pending", "Closed"] }).notNull().default("Open"),
  creator_id: text("creator_id").notNull(),
  winner_url: text("winner_url"),
  winner_submission_id: integer("winner_submission_id"),
  participants_count: integer("participants_count").notNull().default(0),
  initial_participants_count: integer("initial_participants_count").notNull().default(0),
  created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
  updated_at: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

export const task_submissions = sqliteTable(
  "task_submissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    task_id: integer("task_id").notNull(),
    submitter_id: text("submitter_id").notNull(),
    submitter_name: text("submitter_name"),
    submitter_avatar: text("submitter_avatar"),
    project_url: text("project_url").notNull(),
    social_media_url: text("social_media_url"),
    submission_status: text("submission_status", {
      enum: ["submitted", "awarded", "not_awarded"],
    }).notNull().default("submitted"),
    notes: text("notes"),
    created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
    updated_at: text("updated_at").notNull().default(sql`(current_timestamp)`),
  },
  (t) => ({
    byTask: index("idx_submissions_task").on(t.task_id),
    bySubmitter: index("idx_submissions_submitter").on(t.submitter_id),
  })
);

export const task_comments = sqliteTable(
  "task_comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    task_id: integer("task_id").notNull(),
    commenter_id: text("commenter_id").notNull(),
    commenter_name: text("commenter_name"),
    commenter_avatar: text("commenter_avatar"),
    content: text("content").notNull(),
    parent_id: integer("parent_id"),
    likes_count: integer("likes_count").notNull().default(0),
    created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (t) => ({
    byTask: index("idx_comments_task").on(t.task_id),
  })
);

export const comment_likes = sqliteTable(
  "comment_likes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    comment_id: integer("comment_id").notNull(),
    user_id: text("user_id").notNull(),
    created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (t) => ({
    uniqPerUser: uniqueIndex("uniq_comment_user").on(t.comment_id, t.user_id),
  })
);

export const user_profiles = sqliteTable("user_profiles", {
  user_id: text("user_id").primaryKey(),
  display_name: text("display_name"),
  photo_url: text("photo_url"),
  discord_id: text("discord_id"),
  paypal_email: text("paypal_email"),
  age_range: text("age_range"),
  profession: text("profession"),
  bio: text("bio"),
  participation_count: integer("participation_count").notNull().default(0),
  award_count: integer("award_count").notNull().default(0),
  is_blacklist: integer("is_blacklist", { mode: "boolean" }).notNull().default(false),
  created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
  updated_at: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

export const user_notifications = sqliteTable(
  "user_notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: text("user_id").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull(),
    related_task_id: integer("related_task_id"),
    related_submission_id: integer("related_submission_id"),
    is_read: integer("is_read", { mode: "boolean" }).notNull().default(false),
    created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (t) => ({
    byUser: index("idx_notifications_user").on(t.user_id),
  })
);

export const countdown_settings = sqliteTable("countdown_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event_name: text("event_name"),
  start_time: text("start_time").notNull(),
  end_time: text("end_time").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_by: text("created_by").notNull(),
  created_at: text("created_at").notNull().default(sql`(current_timestamp)`),
  updated_at: text("updated_at").notNull().default(sql`(current_timestamp)`),
});
