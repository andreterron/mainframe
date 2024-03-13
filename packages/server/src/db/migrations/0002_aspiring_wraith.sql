ALTER TABLE datasets ADD `credentials` text;
--> statement-breakpoint
UPDATE `datasets`
SET `credentials` = '{"token": "' || `token` || '"}'
WHERE token is not null and credentials is null;
--> statement-breakpoint
ALTER TABLE `datasets` DROP COLUMN `token`;