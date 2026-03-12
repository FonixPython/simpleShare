CREATE TABLE IF NOT EXISTS `session_tokens` (
  `token` varchar(200) NOT NULL,
  `user_id` text NOT NULL,
  `is_valid` tinyint(1) DEFAULT 1,
  `user_agent` text DEFAULT NULL,
  `added_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
