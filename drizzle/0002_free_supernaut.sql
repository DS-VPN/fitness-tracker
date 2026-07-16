CREATE TABLE `meal_ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal_id` integer NOT NULL,
	`product_id` integer,
	`sub_meal_id` integer,
	`quantity` real DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sub_meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "meal_ingredients_exactly_one_ref" CHECK(("meal_ingredients"."product_id" is not null and "meal_ingredients"."sub_meal_id" is null) or ("meal_ingredients"."product_id" is null and "meal_ingredients"."sub_meal_id" is not null))
);
--> statement-breakpoint
CREATE INDEX `meal_ingredients_meal_idx` ON `meal_ingredients` (`meal_id`);--> statement-breakpoint
CREATE INDEX `meal_ingredients_product_idx` ON `meal_ingredients` (`product_id`);--> statement-breakpoint
CREATE INDEX `meal_ingredients_submeal_idx` ON `meal_ingredients` (`sub_meal_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`serving_size` text,
	`calories` real DEFAULT 0 NOT NULL,
	`protein` real DEFAULT 0 NOT NULL,
	`carbs` real DEFAULT 0 NOT NULL,
	`fat` real DEFAULT 0 NOT NULL,
	`fiber` real,
	`sugar` real,
	`sodium` real,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `products_user_idx` ON `products` (`user_id`);--> statement-breakpoint
CREATE INDEX `products_name_idx` ON `products` (`name`);--> statement-breakpoint
-- One-time backfill: every pre-existing meal (which stored a single product's macros directly)
-- becomes a product, and the original meal becomes a recipe with that product as its sole
-- ingredient at quantity 1 — same displayed macros, just represented the new way. Correlates
-- meal -> product purely by insertion-order rank (products is empty before this migration and
-- both selects insert/read in the same id-ascending order), avoiding ambiguous name/timestamp matching.
INSERT INTO `products` (`user_id`, `name`, `brand`, `serving_size`, `calories`, `protein`, `carbs`, `fat`, `fiber`, `sugar`, `sodium`, `created_at`, `updated_at`)
SELECT `user_id`, `name`, `brand`, `serving_size`, `calories`, `protein`, `carbs`, `fat`, `fiber`, `sugar`, `sodium`, `created_at`, `updated_at` FROM `meals` ORDER BY `id`;
--> statement-breakpoint
INSERT INTO `meal_ingredients` (`meal_id`, `product_id`, `quantity`, `sort_order`, `created_at`)
SELECT m.id, p.id, 1, 0, unixepoch('subsec') * 1000
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM `meals`) m
JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM `products`) p ON p.rn = m.rn;