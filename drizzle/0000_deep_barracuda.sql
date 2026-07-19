CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`guest_id` integer NOT NULL,
	`check_in` text NOT NULL,
	`check_out` text NOT NULL,
	`guests` integer NOT NULL,
	`nights` integer NOT NULL,
	`subtotal` real NOT NULL,
	`cleaning_fee` real NOT NULL,
	`service_fee` real NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`confirmation_code` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guest_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_confirmation_code_unique` ON `bookings` (`confirmation_code`);--> statement-breakpoint
CREATE TABLE `favorites` (
	`user_id` integer NOT NULL,
	`listing_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `listing_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`host_id` integer NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`description` text NOT NULL,
	`city` text NOT NULL,
	`country` text NOT NULL,
	`latitude` real DEFAULT 0 NOT NULL,
	`longitude` real DEFAULT 0 NOT NULL,
	`price` real NOT NULL,
	`cleaning_fee` real DEFAULT 0 NOT NULL,
	`service_fee_rate` real DEFAULT 0.12 NOT NULL,
	`rating` real DEFAULT 5 NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`property_type` text NOT NULL,
	`category` text NOT NULL,
	`guest_capacity` integer NOT NULL,
	`bedrooms` integer NOT NULL,
	`beds` integer NOT NULL,
	`baths` real NOT NULL,
	`amenities` text DEFAULT '[]' NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`badge` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'guest' NOT NULL,
	`avatar_url` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`is_superhost` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);