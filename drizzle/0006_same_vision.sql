DROP INDEX `exercises_user_name_unique`;--> statement-breakpoint
ALTER TABLE `exercises` ADD `brand` text;--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_user_name_brand_unique` ON `exercises` (`user_id`,`name`,`brand`);