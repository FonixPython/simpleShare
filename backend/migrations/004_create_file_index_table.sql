CREATE TABLE IF NOT EXISTS `file_index` (
  `id` varchar(6) NOT NULL,
  `visibility` int(11) NOT NULL DEFAULT 1,
  `date_added` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `file_size_in_bytes` int(11) DEFAULT NULL,
  `stored_filename` text NOT NULL,
  `original_name` text NOT NULL,
  `mime_type` text NOT NULL,
  `user_id` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
