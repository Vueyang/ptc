<?php
require 'config.php';
$user = 'admin';
$pass = 'admin123';
$hash = password_hash($pass, PASSWORD_DEFAULT);
$st = db()->prepare("INSERT INTO users (username,password_hash,full_name,role)
  VALUES (?,?,?,'admin')
  ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)");
$st->execute([$user, $hash, 'ຜູ້ດູແລລະບົບ']);
echo 'ສຳເລັດ';
?>