CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_name` text NOT NULL,
	`score` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
