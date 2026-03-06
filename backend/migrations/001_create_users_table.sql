CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(255) NOT NULL DEFAULT uuid(),
  `username` varchar(255) NOT NULL,
  `password_hash` text NOT NULL,
  `quota_in_bytes` bigint(20) NOT NULL DEFAULT 500000000,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `date_of_creation` timestamp NOT NULL DEFAULT curtime(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
