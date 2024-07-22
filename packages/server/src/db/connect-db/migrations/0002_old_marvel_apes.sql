ALTER TABLE `connections` RENAME TO `old_connections`;
--> statement-breakpoint
CREATE TABLE `connections` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`nango_connection_id` text,
	`provider` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `connections` SELECT * FROM `old_connections`;
--> statement-breakpoint
DROP TABLE IF EXISTS `old_connections`;
