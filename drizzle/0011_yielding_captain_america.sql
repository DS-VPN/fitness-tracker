CREATE TABLE `meal_shares` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer NOT NULL,
	`shared_with_user_id` integer NOT NULL,
	`meal_id` integer,
	`category_id` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shared_with_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "meal_shares_scope_valid" CHECK(not ("meal_shares"."meal_id" is not null and "meal_shares"."category_id" is not null))
);
--> statement-breakpoint
CREATE INDEX `meal_shares_owner_idx` ON `meal_shares` (`owner_id`);--> statement-breakpoint
CREATE INDEX `meal_shares_shared_with_idx` ON `meal_shares` (`shared_with_user_id`);--> statement-breakpoint
CREATE INDEX `meal_shares_meal_idx` ON `meal_shares` (`meal_id`);--> statement-breakpoint
CREATE INDEX `meal_shares_category_idx` ON `meal_shares` (`category_id`);