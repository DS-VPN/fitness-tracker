CREATE TABLE `catalog_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`off_code` text NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`barcode` text,
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
	CONSTRAINT "catalog_products_unit_valid" CHECK("catalog_products"."unit" in ('g', 'ml', 'pcs'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_products_off_code_unique` ON `catalog_products` (`off_code`);--> statement-breakpoint
CREATE INDEX `catalog_products_name_idx` ON `catalog_products` (`name`);