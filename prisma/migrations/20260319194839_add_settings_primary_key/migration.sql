-- CreateTable
CREATE TABLE `file_groups` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `file_ids` LONGTEXT NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_index` (
    `id` VARCHAR(6) NOT NULL,
    `visibility` INTEGER NOT NULL DEFAULT 1,
    `date_added` TIMESTAMP(0) NULL DEFAULT (curtime()),
    `file_size_in_bytes` BIGINT NULL,
    `stored_filename` TEXT NOT NULL,
    `original_name` TEXT NOT NULL,
    `mime_type` TEXT NOT NULL,
    `user_id` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `id` VARCHAR(255) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `applied_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_tokens` (
    `token` VARCHAR(200) NOT NULL,
    `user_id` TEXT NOT NULL,
    `is_valid` BOOLEAN NULL DEFAULT true,
    `user_agent` TEXT NULL,
    `added_on` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `name` VARCHAR(255) NOT NULL,
    `num_value` BIGINT NULL,
    `text_value` TEXT NULL,
    `comment` TEXT NULL,

    UNIQUE INDEX `settings_name_key`(`name`),
    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(255) NOT NULL DEFAULT (uuid()),
    `username` VARCHAR(255) NOT NULL,
    `password_hash` TEXT NOT NULL,
    `quota_in_bytes` BIGINT NOT NULL DEFAULT 500000000,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `date_of_creation` TIMESTAMP(0) NOT NULL DEFAULT (curtime()),

    UNIQUE INDEX `username`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `file_groups` ADD CONSTRAINT `1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
