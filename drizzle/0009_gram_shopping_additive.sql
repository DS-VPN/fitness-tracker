CREATE TABLE `shopping_list_item_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`meal_id` integer,
	`meal_name` text,
	`multiplier` real DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `shopping_list_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `shopping_list_item_sources_item_idx` ON `shopping_list_item_sources` (`item_id`);--> statement-breakpoint
CREATE INDEX `shopping_list_item_sources_meal_idx` ON `shopping_list_item_sources` (`meal_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`barcode` text,
	`serving_size` text,
	`amount` real DEFAULT 100 NOT NULL,
	`unit` text DEFAULT 'g' NOT NULL,
	`calories` real DEFAULT 0 NOT NULL,
	`protein` real DEFAULT 0 NOT NULL,
	`carbs` real DEFAULT 0 NOT NULL,
	`fat` real DEFAULT 0 NOT NULL,
	`fiber` real,
	`sugar` real,
	`sodium` real,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "products_unit_valid" CHECK("__new_products"."unit" in ('g', 'ml', 'pcs'))
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "user_id", "name", "brand", "barcode", "serving_size", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "created_at", "updated_at") SELECT "id", "user_id", "name", "brand", "barcode", "serving_size", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `products_user_idx` ON `products` (`user_id`);--> statement-breakpoint
CREATE INDEX `products_name_idx` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `products_barcode_idx` ON `products` (`barcode`);--> statement-breakpoint
ALTER TABLE `shopping_list_items` ADD `product_id` integer REFERENCES products(id) ON DELETE set null;--> statement-breakpoint
CREATE INDEX `shopping_list_product_idx` ON `shopping_list_items` (`product_id`);--> statement-breakpoint
-- Best-effort: parse the old free-text serving_size ("100 g", "250ml", "2 stk") into structured amount/unit.
-- SQLite's CAST(text AS REAL) reads a leading numeric prefix and returns 0 for anything unparseable, so this
-- only overwrites the 100/g default when a real leading number was found; everything else keeps that default.
UPDATE `products`
SET
	`amount` = CAST(`serving_size` AS REAL),
	`unit` = CASE
		WHEN lower(`serving_size`) LIKE '%ml%' THEN 'ml'
		WHEN lower(`serving_size`) LIKE '%stk%' OR lower(`serving_size`) LIKE '%pcs%' OR lower(`serving_size`) LIKE '%piece%' THEN 'pcs'
		ELSE 'g'
	END
WHERE `serving_size` IS NOT NULL AND CAST(`serving_size` AS REAL) > 0;