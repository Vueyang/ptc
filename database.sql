-- ລະບົບຄຸ້ມຄອງຄະນະໂຄສະນາອົບຮົມສູນກາງພັກ + ຈັດເກັບອຸປະກອນ
-- Import ຜ່ານ phpMyAdmin (XAMPP) ຫຼື: mysql -u root < database.sql
CREATE DATABASE IF NOT EXISTS ptc_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ptc_system;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ກົມ (6) ແລະ ທຽບເທົ່າກົມ (8)
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seq TINYINT NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  dept_type ENUM('department','equivalent') NOT NULL,
  phone VARCHAR(50) NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  position VARCHAR(150) NULL,
  phone VARCHAR(50) NULL,
  department_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE asset_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category_id INT NULL,
  brand VARCHAR(100) NULL,
  serial_no VARCHAR(100) NULL,
  purchase_date DATE NULL,
  price DECIMAL(15,2) NULL DEFAULT 0,
  status ENUM('in_stock','in_use','repair','disposed') NOT NULL DEFAULT 'in_stock',
  department_id INT NULL,
  employee_id INT NULL,
  location VARCHAR(150) NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ປະຫວັດ ມອບ / ສົ່ງຄືນ / ໂອນ / ສ້ອມແປງ / ຕັດບັນຊີ
CREATE TABLE asset_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  tx_type ENUM('assign','return','transfer','repair','dispose') NOT NULL,
  from_department_id INT NULL,
  to_department_id INT NULL,
  employee_id INT NULL,
  tx_date DATE NOT NULL,
  note TEXT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (from_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (to_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ເຟດ 2: audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  username VARCHAR(50) NULL,
  action VARCHAR(30) NOT NULL,
  resource VARCHAR(30) NOT NULL,
  record_id INT NULL,
  summary VARCHAR(255) NULL,
  old_data TEXT NULL,
  new_data TEXT NULL,
  ip VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at),
  INDEX idx_resource (resource, record_id),
  INDEX idx_ip_action (ip, action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO departments (seq, code, name, dept_type) VALUES
(1,'D01','ຫ້ອງການ','equivalent'),
(2,'D02','ກົມຈັດຕັ້ງ','department'),
(3,'D03','ກົມກວດກາ','department'),
(4,'D04','ກົມໂຄສະນາ','department'),
(5,'D05','ກົມອົບຮົມ','department'),
(6,'D06','ກົມຂໍ້ມູນຂ່າວສານ','department'),
(7,'D07','ກົມສື່ມວນຊົນ','department'),
(8,'D08','ຫ້ອງການສະພາທິດສະດີສູນກາງພັກ','equivalent'),
(9,'D09','ວາລະສານອະລຸນໃໝ່','equivalent'),
(10,'D10','ສຳນັກຂ່າວສານປະເທດລາວ','equivalent'),
(11,'D11','ວິທະຍຸກະຈາຍສຽງແຫ່ງຊາດລາວ','equivalent'),
(12,'D12','ໂທລະພາບແຫ່ງຊາດລາວ','equivalent'),
(13,'D13','ໜັງສືພິມປະຊາຊົນ','equivalent'),
(14,'D14','ໜັງສືພິມພາສາຕ່າງປະເທດ','equivalent');

INSERT INTO asset_categories (name) VALUES
('ຄອມພິວເຕີ / ແລັບທັອບ'),('ເຄື່ອງພິມ / ເຄື່ອງສະແກນ'),('ກ້ອງຖ່າຍຮູບ / ວິດີໂອ'),
('ອຸປະກອນສຽງ'),('ເຄື່ອງໃຊ້ຫ້ອງການ'),('ຍານພາຫະນະ'),('ອຸປະກອນເຄືອຂ່າຍ'),('ອື່ນໆ');

-- ຜູ້ໃຊ້ admin ຈະຖືກສ້າງອັດຕະໂນມັດຕອນ login ຄັ້ງທຳອິດ: admin / admin123
