CREATE TABLE `components` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`code` text DEFAULT '' NOT NULL
);
