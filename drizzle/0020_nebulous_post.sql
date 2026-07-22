CREATE TABLE `peptide_doses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`peptide_id` integer NOT NULL,
	`protocol_id` integer,
	`vial_id` integer,
	`date` text NOT NULL,
	`enc` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`peptide_id`) REFERENCES `peptides`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`protocol_id`) REFERENCES `peptide_protocols`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vial_id`) REFERENCES `peptide_vials`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `peptide_doses_user_date_idx` ON `peptide_doses` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `peptide_doses_peptide_idx` ON `peptide_doses` (`peptide_id`);--> statement-breakpoint
CREATE TABLE `peptide_protocols` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`peptide_id` integer NOT NULL,
	`enc` text NOT NULL,
	`start_date` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`peptide_id`) REFERENCES `peptides`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `peptide_protocols_user_idx` ON `peptide_protocols` (`user_id`);--> statement-breakpoint
CREATE INDEX `peptide_protocols_peptide_idx` ON `peptide_protocols` (`peptide_id`);--> statement-breakpoint
CREATE TABLE `peptide_vials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`peptide_id` integer NOT NULL,
	`enc` text NOT NULL,
	`depleted` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`peptide_id`) REFERENCES `peptides`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `peptide_vials_user_idx` ON `peptide_vials` (`user_id`);--> statement-breakpoint
CREATE TABLE `peptides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`enc` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `peptides_user_idx` ON `peptides` (`user_id`);