CREATE TABLE `assignments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`quiz_id` bigint unsigned NOT NULL,
	`assigned_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_assignment` UNIQUE(`user_id`,`quiz_id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`quiz_id` bigint unsigned NOT NULL,
	`question_text` text NOT NULL,
	`option_a` varchar(500) NOT NULL,
	`option_b` varchar(500) NOT NULL,
	`option_c` varchar(500) NOT NULL,
	`option_d` varchar(500) NOT NULL,
	`correct_option` enum('A','B','C','D') NOT NULL,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submission_answers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`submission_id` bigint unsigned NOT NULL,
	`question_id` bigint unsigned NOT NULL,
	`answer` varchar(10) NOT NULL,
	CONSTRAINT `submission_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`quiz_id` bigint unsigned NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`submitted_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('teacher','student') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_quiz_id_quizzes_id_fk` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_quiz_id_quizzes_id_fk` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submission_answers` ADD CONSTRAINT `submission_answers_submission_id_submissions_id_fk` FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submission_answers` ADD CONSTRAINT `submission_answers_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_quiz_id_quizzes_id_fk` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE cascade ON UPDATE no action;