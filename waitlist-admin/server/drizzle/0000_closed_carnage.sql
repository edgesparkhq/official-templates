CREATE TABLE `signups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`source` text DEFAULT 'landing',
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `signups_email_unique` ON `signups` (`email`);--> statement-breakpoint
CREATE INDEX `signups_created_at_idx` ON `signups` (`created_at`);