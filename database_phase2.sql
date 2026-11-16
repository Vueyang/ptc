-- ເຟດ 2: ເພີ່ມຕາຕະລາງບັນທຶກປະຫວັດການແກ້ໄຂ (audit log)
-- ວິທີໃຊ້: ເປີດ phpMyAdmin > ເລືອກຖານຂໍ້ມູນຂອງທ່ານ (ເຊັ່ນ database) > ແຖບ SQL > ວາງ ແລ້ວກົດ Go
-- (ບໍ່ມີຄຳສັ່ງ USE ເພື່ອໃຫ້ໃຊ້ໄດ້ກັບຊື່ຖານຂໍ້ມູນໃດກໍໄດ້)
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
