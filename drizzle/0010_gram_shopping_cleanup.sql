PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_shopping_list_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`product_id` integer,
	`name` text,
	`brand` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_shopping_list_items`("id", "user_id", "product_id", "name", "brand", "quantity", "checked", "created_at") SELECT "id", "user_id", "product_id", "name", "brand", "quantity", "checked", "created_at" FROM `shopping_list_items`;--> statement-breakpoint
DROP TABLE `shopping_list_items`;--> statement-breakpoint
ALTER TABLE `__new_shopping_list_items` RENAME TO `shopping_list_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `shopping_list_user_idx` ON `shopping_list_items` (`user_id`);--> statement-breakpoint
CREATE INDEX `shopping_list_product_idx` ON `shopping_list_items` (`product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `shopping_list_items_user_product_unique` ON `shopping_list_items` (`user_id`,`product_id`) WHERE "shopping_list_items"."product_id" is not null;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `serving_size`;