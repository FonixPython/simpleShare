-- /docker-entrypoint-initdb.d/01_schema.sql
-- Executed automatically by the official MariaDB image on first run.
-- The database named by MYSQL_DATABASE already exists at this point.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ----------------------------------------------------------------
-- users  (no FK deps — must come first)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`               VARCHAR(255) NOT NULL DEFAULT (UUID()),
  `username`         VARCHAR(255) NOT NULL,
  `password_hash`    LONGTEXT     NOT NULL,
  `quota_in_bytes`   BIGINT       NOT NULL DEFAULT 500000000,
  `is_admin`         TINYINT(1)   NOT NULL DEFAULT 0,
  `date_of_creation` TIMESTAMP    NOT NULL DEFAULT (CURTIME()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- file_groups  (FK → users)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `file_groups` (
  `id`         VARCHAR(255) NOT NULL,
  `name`       VARCHAR(255) NOT NULL,
  `file_ids`   LONGTEXT     NOT NULL,
  `user_id`    VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id`),
  CONSTRAINT `fk_file_groups_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- file_index
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `file_index` (
  `id`                 VARCHAR(6)  NOT NULL,
  `visibility`         INT         NOT NULL DEFAULT 1,
  `date_added`         TIMESTAMP   NULL     DEFAULT (CURTIME()),
  `file_size_in_bytes` BIGINT      NULL,
  `stored_filename`    LONGTEXT    NOT NULL,
  `original_name`      LONGTEXT    NOT NULL,
  `mime_type`          LONGTEXT    NOT NULL,
  `user_id`            LONGTEXT    NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- migrations
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `migrations` (
  `id`         VARCHAR(255) NOT NULL,
  `filename`   VARCHAR(255) NOT NULL,
  `applied_at` TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- session_tokens
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `session_tokens` (
  `token`      VARCHAR(200) NOT NULL,
  `user_id`    LONGTEXT     NOT NULL,
  `is_valid`   TINYINT(1)   NULL DEFAULT 1,
  `user_agent` LONGTEXT     NULL,
  `added_on`   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- settings
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `name`       VARCHAR(255) NOT NULL,
  `num_value`  BIGINT       NULL,
  `text_value` LONGTEXT     NULL,
  `comment`    LONGTEXT     NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
