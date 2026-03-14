CREATE TABLE IF NOT EXISTS `settings` (
  `name` text NOT NULL,
  `num_value` bigint(20) DEFAULT NULL,
  `text_value` text DEFAULT NULL,
  `comment` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
