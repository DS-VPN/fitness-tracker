CREATE TABLE `body_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real,
	`body_fat_pct` real,
	`neck_cm` real,
	`chest_cm` real,
	`waist_cm` real,
	`hips_cm` real,
	`thigh_cm` real,
	`arm_cm` real,
	`calf_cm` real,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `body_metrics_user_date_idx` ON `body_metrics` (`user_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `body_metrics_user_date_unique` ON `body_metrics` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `progress_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`pose` text,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`byte_size` integer NOT NULL,
	`caption` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "progress_photos_pose_valid" CHECK("progress_photos"."pose" is null or "progress_photos"."pose" in ('front', 'side', 'back'))
);
--> statement-breakpoint
CREATE INDEX `progress_photos_user_date_idx` ON `progress_photos` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`weight_unit` text DEFAULT 'kg' NOT NULL,
	`length_unit` text DEFAULT 'cm' NOT NULL,
	`height_cm` real,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "user_settings_weight_unit_valid" CHECK("user_settings"."weight_unit" in ('kg', 'lb')),
	CONSTRAINT "user_settings_length_unit_valid" CHECK("user_settings"."length_unit" in ('cm', 'in'))
);
--> statement-breakpoint
CREATE TABLE `weight_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`target_weight_kg` real NOT NULL,
	`target_date` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weight_goals_user_unique` ON `weight_goals` (`user_id`);