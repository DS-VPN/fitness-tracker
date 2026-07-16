CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `shopping_list_shares` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer NOT NULL,
	`shared_with_user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shared_with_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `shopping_list_shares_owner_idx` ON `shopping_list_shares` (`owner_id`);--> statement-breakpoint
CREATE INDEX `shopping_list_shares_shared_with_idx` ON `shopping_list_shares` (`shared_with_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `shopping_list_shares_pair_unique` ON `shopping_list_shares` (`owner_id`,`shared_with_user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_lower_unique` ON `users` (lower("username"));--> statement-breakpoint
DROP INDEX `categories_name_unique`;--> statement-breakpoint
ALTER TABLE `categories` ADD `user_id` integer NOT NULL REFERENCES users(id);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_user_name_unique` ON `categories` (`user_id`,`name`);--> statement-breakpoint
DROP INDEX `exercises_name_unique`;--> statement-breakpoint
ALTER TABLE `exercises` ADD `user_id` integer NOT NULL REFERENCES users(id);--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_user_name_unique` ON `exercises` (`user_id`,`name`);--> statement-breakpoint
ALTER TABLE `meals` ADD `user_id` integer NOT NULL REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `meals_user_idx` ON `meals` (`user_id`);--> statement-breakpoint
ALTER TABLE `shopping_list_items` ADD `user_id` integer NOT NULL REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `shopping_list_user_idx` ON `shopping_list_items` (`user_id`);--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `user_id` integer NOT NULL REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `workout_sessions_user_idx` ON `workout_sessions` (`user_id`);