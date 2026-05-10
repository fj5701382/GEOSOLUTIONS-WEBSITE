-- Database Schema for GEO ACADEMY Payment System

CREATE TABLE IF NOT EXISTS `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) NOT NULL,
  `reference` varchar(100) NOT NULL UNIQUE,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `status` enum('success','failed','pending','abandoned') DEFAULT 'pending',
  `payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `gateway_response` text,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_reference` (`reference`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `student_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) NOT NULL UNIQUE,
  `current_period_end` datetime NOT NULL,
  `status` enum('active','expired','cancelled') DEFAULT 'expired',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sub_student` (`student_id`),
  KEY `idx_sub_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payment_receipts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` int(11) NOT NULL,
  `receipt_url` varchar(255) DEFAULT NULL,
  `generated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
