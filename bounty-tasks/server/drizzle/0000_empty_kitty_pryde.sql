CREATE TABLE `bounty_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`cover_image` text,
	`reward_amount` integer NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`creator_id` text NOT NULL,
	`winner_url` text,
	`winner_submission_id` integer,
	`participants_count` integer DEFAULT 0 NOT NULL,
	`initial_participants_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `comment_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`comment_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_comment_user` ON `comment_likes` (`comment_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `countdown_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_name` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`commenter_id` text NOT NULL,
	`commenter_name` text,
	`commenter_avatar` text,
	`content` text NOT NULL,
	`parent_id` integer,
	`likes_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_comments_task` ON `task_comments` (`task_id`);--> statement-breakpoint
CREATE TABLE `task_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`submitter_id` text NOT NULL,
	`submitter_name` text,
	`submitter_avatar` text,
	`project_url` text NOT NULL,
	`social_media_url` text,
	`submission_status` text DEFAULT 'submitted' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_submissions_task` ON `task_submissions` (`task_id`);--> statement-breakpoint
CREATE INDEX `idx_submissions_submitter` ON `task_submissions` (`submitter_id`);--> statement-breakpoint
CREATE TABLE `user_notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`related_task_id` integer,
	`related_submission_id` integer,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user` ON `user_notifications` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`photo_url` text,
	`discord_id` text,
	`paypal_email` text,
	`age_range` text,
	`profession` text,
	`bio` text,
	`participation_count` integer DEFAULT 0 NOT NULL,
	`award_count` integer DEFAULT 0 NOT NULL,
	`is_blacklist` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
