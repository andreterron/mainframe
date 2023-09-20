CREATE TABLE `datasets` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`integration_type` text,
	`token` text
);
--> statement-breakpoint
CREATE TABLE `objects` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`source_id` text,
	`object_type` text NOT NULL,
	`dataset_id` text NOT NULL,
	`data` text,
	FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rows` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`source_id` text,
	`table_id` text NOT NULL,
	`data` text,
	FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`expires` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tables` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`key` text NOT NULL,
	`dataset_id` text,
	FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`single_user_key` text check(`single_user_key` == 'admin') DEFAULT 'admin' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `objects_object_type_dataset_id_unique` ON `objects` (`object_type`,`dataset_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `rows_table_id_source_id_unique` ON `rows` (`table_id`,`source_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tables_dataset_id_key_unique` ON `tables` (`dataset_id`,`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_single_user_key_unique` ON `users` (`single_user_key`);