-- PTC backup 2026-11-16 19:39:08
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `asset_categories`;
CREATE TABLE `asset_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;

INSERT INTO `asset_categories` VALUES ('3','ກ້ອງຖ່າຍຮູບ / ວິດີໂອ');
INSERT INTO `asset_categories` VALUES ('1','ຄອມພິວເຕີ / ແລັບທັອບ');
INSERT INTO `asset_categories` VALUES ('6','ຍານພາຫະນະ');
INSERT INTO `asset_categories` VALUES ('8','ອື່ນໆ');
INSERT INTO `asset_categories` VALUES ('4','ອຸປະກອນສຽງ');
INSERT INTO `asset_categories` VALUES ('7','ອຸປະກອນເຄືອຂ່າຍ');
INSERT INTO `asset_categories` VALUES ('2','ເຄື່ອງພິມ / ເຄື່ອງສະແກນ');
INSERT INTO `asset_categories` VALUES ('5','ເຄື່ອງໃຊ້ຫ້ອງການ');

DROP TABLE IF EXISTS `asset_transactions`;
CREATE TABLE `asset_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `tx_type` enum('assign','return','transfer','repair','dispose') NOT NULL,
  `from_department_id` int(11) DEFAULT NULL,
  `to_department_id` int(11) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `tx_date` date NOT NULL,
  `note` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  KEY `from_department_id` (`from_department_id`),
  KEY `to_department_id` (`to_department_id`),
  KEY `employee_id` (`employee_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `asset_transactions_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asset_transactions_ibfk_2` FOREIGN KEY (`from_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `asset_transactions_ibfk_3` FOREIGN KEY (`to_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `asset_transactions_ibfk_4` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `asset_transactions_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

INSERT INTO `asset_transactions` VALUES ('1','1','assign','1','1',NULL,'2026-11-16','','2','2026-11-16 18:20:28');
INSERT INTO `asset_transactions` VALUES ('2','1','transfer','1','3','1','2026-11-16','ໃຊ້ວຽກຫ້ອງການ','2','2026-11-16 18:27:42');

DROP TABLE IF EXISTS `assets`;
CREATE TABLE `assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_code` varchar(40) NOT NULL,
  `name` varchar(200) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `serial_no` varchar(100) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `price` decimal(15,2) DEFAULT 0.00,
  `status` enum('in_stock','in_use','repair','disposed') NOT NULL DEFAULT 'in_stock',
  `department_id` int(11) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_code` (`asset_code`),
  KEY `category_id` (`category_id`),
  KEY `department_id` (`department_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `asset_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `assets_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `assets_ibfk_3` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

INSERT INTO `assets` VALUES ('1','AST-26-0001','computer','1','lanovo',NULL,'2026-11-16','5000000.00','in_use','3','1','4','fkjslkfjsd','2026-11-16 18:19:30');

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` int(11) DEFAULT NULL,
  `summary` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_data` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_data` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_resource` (`resource`,`record_id`),
  KEY `idx_ip_action` (`ip`,`action`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `audit_logs` VALUES ('1','2','admin','create','users','4','tou',NULL,'{\"username\":\"tou\",\"full_name\":\"ຕູ້ ຢ່າງ\",\"role\":\"staff\"}','::1','2026-11-16 19:37:18');

DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seq` tinyint(4) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(200) NOT NULL,
  `dept_type` enum('department','equivalent') NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4;

INSERT INTO `departments` VALUES ('1','1','D01','ຫ້ອງການ','equivalent',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('2','2','D02','ກົມຈັດຕັ້ງ','department',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('3','3','D03','ກົມກວດກາ','department',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('4','4','D04','ກົມໂຄສະນາ','department',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('5','5','D05','ກົມອົບຮົມ','department',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('6','6','D06','ກົມຂໍ້ມູນຂ່າວສານ','department',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('7','7','D07','ກົມສື່ມວນຊົນ','department',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('8','8','D08','ຫ້ອງການສະພາທິດສະດີສູນກາງພັກ','equivalent',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('9','9','D09','ວາລະສານອະລຸນໃໝ່','equivalent',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('10','10','D10','ສຳນັກຂ່າວສານປະເທດລາວ','equivalent',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('11','11','D11','ວິທະຍຸກະຈາຍສຽງແຫ່ງຊາດລາວ','equivalent',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('12','12','D12','ໂທລະພາບແຫ່ງຊາດລາວ','equivalent',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('13','13','D13','ໜັງສືພິມປະຊາຊົນ','equivalent',NULL,NULL,'2026-11-16 17:45:41');
INSERT INTO `departments` VALUES ('14','14','D14','ໜັງສືພິມພາສາຕ່າງປະເທດ','equivalent',NULL,NULL,'2026-11-16 17:45:41');

DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `emp_code` varchar(30) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `position` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `department_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `emp_code` (`emp_code`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

INSERT INTO `employees` VALUES ('1','00000000001','ຕູ້ ຢ່າງ','ວິຊາການ','02088888888','3','2026-11-16 18:23:07');

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `role` enum('admin','staff') NOT NULL DEFAULT 'staff',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` VALUES ('2','admin','$2y$10$XA0Chu13FkLQXIF9yfz.i.3JC11SONHbQVdaSGTXvEkyZfoi4/YfG','tou','admin','2026-11-16 18:10:25');
INSERT INTO `users` VALUES ('4','tou','$2y$10$o3EJU71qy7NwB5C8Vz8KJ./4Nqgij/vYCCTk6lAAWMpz9kYEiDokq','ຕູ້ ຢ່າງ','staff','2026-11-16 19:37:18');

SET FOREIGN_KEY_CHECKS=1;
