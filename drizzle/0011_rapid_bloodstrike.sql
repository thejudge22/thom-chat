CREATE TABLE `message_interactions` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `message_interactions_message_id_idx` ON `message_interactions` (`message_id`);--> statement-breakpoint
CREATE INDEX `message_interactions_user_id_idx` ON `message_interactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `message_interactions_action_idx` ON `message_interactions` (`action`);--> statement-breakpoint
CREATE TABLE `message_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer,
	`thumbs` text,
	`categories` text,
	`feedback` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `message_ratings_message_id_idx` ON `message_ratings` (`message_id`);--> statement-breakpoint
CREATE INDEX `message_ratings_user_id_idx` ON `message_ratings` (`user_id`);--> statement-breakpoint
CREATE TABLE `model_performance_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`model_id` text NOT NULL,
	`provider` text NOT NULL,
	`total_messages` integer DEFAULT 0 NOT NULL,
	`avg_rating` real,
	`thumbs_up_count` integer DEFAULT 0 NOT NULL,
	`thumbs_down_count` integer DEFAULT 0 NOT NULL,
	`regenerate_count` integer DEFAULT 0 NOT NULL,
	`avg_response_time` real,
	`avg_tokens` real,
	`total_cost` real DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`accurate_count` integer DEFAULT 0 NOT NULL,
	`helpful_count` integer DEFAULT 0 NOT NULL,
	`creative_count` integer DEFAULT 0 NOT NULL,
	`fast_count` integer DEFAULT 0 NOT NULL,
	`cost_effective_count` integer DEFAULT 0 NOT NULL,
	`last_updated` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `model_performance_user_id_idx` ON `model_performance_stats` (`user_id`);--> statement-breakpoint
CREATE INDEX `model_performance_model_provider_idx` ON `model_performance_stats` (`model_id`,`provider`);--> statement-breakpoint
CREATE INDEX `model_performance_user_model_provider_idx` ON `model_performance_stats` (`user_id`,`model_id`,`provider`);