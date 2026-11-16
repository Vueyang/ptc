<?php
// ຟັງຊັນຊ່ວຍ (ຮອງຮັບ PHP 7.0 ຂຶ້ນໄປ)
date_default_timezone_set('Asia/Vientiane');

function out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    exit;
}
function fail($msg, $code = 400) { out(['error' => $msg], $code); }

function start_session() {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    if (PHP_VERSION_ID >= 70300) {
        session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax']);
    } else {
        session_set_cookie_params(0, '/; samesite=Lax', '', $https, true);
    }
    session_start();
}

function client_ip() { return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : ''; }

function need_admin($me) {
    if ($me['role'] !== 'admin') fail('ສະເພາະ admin ເທົ່ານັ້ນ', 403);
}

function same_val($a, $b) {
    if (is_numeric($a) && is_numeric($b)) return (float)$a === (float)$b;
    return (string)$a === (string)$b;
}

function label_of($row) {
    foreach (['name', 'full_name', 'asset_code', 'username'] as $k) {
        if (is_array($row) && !empty($row[$k])) return (string)$row[$k];
    }
    return '';
}

/* ---------- Audit log ---------- */
function audit($pdo, $action, $resource, $rid = null, $old = null, $new = null, $summary = '', $asUser = null) {
    try {
        $u = $asUser ? $asUser : (isset($_SESSION['user']) ? $_SESSION['user'] : null);
        $mask = function ($d) {
            if (is_array($d)) { unset($d['password_hash'], $d['password'], $d['new_password'], $d['old_password']); }
            return $d;
        };
        $old = $mask($old); $new = $mask($new);
        $st = $pdo->prepare('INSERT INTO audit_logs (user_id,username,action,resource,record_id,summary,old_data,new_data,ip) VALUES (?,?,?,?,?,?,?,?,?)');
        $st->execute([
            $u ? $u['id'] : null,
            $u ? $u['username'] : null,
            $action, $resource, $rid,
            mb_substr((string)$summary, 0, 250),
            $old === null ? null : json_encode($old, JSON_UNESCAPED_UNICODE),
            $new === null ? null : json_encode($new, JSON_UNESCAPED_UNICODE),
            client_ip()
        ]);
    } catch (Exception $e) {
        error_log('audit failed: ' . $e->getMessage());   // ຖ້າຍັງບໍ່ໄດ້ສ້າງຕາຕະລາງ audit_logs ຈະບໍ່ລົ້ມທັງລະບົບ
    }
}

/* ---------- Backup (ບໍ່ຕ້ອງໃຊ້ mysqldump) ---------- */
function backup_dir() {
    $d = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'backups';
    if (!is_dir($d)) { mkdir($d, 0775, true); }
    return $d;
}

function make_backup($pdo, $keep = 30) {
    $file = backup_dir() . DIRECTORY_SEPARATOR . 'ptc_' . date('Ymd_His') . '.sql';
    $fh = fopen($file, 'w');
    if (!$fh) { throw new Exception('ສ້າງໄຟລ໌ສຳຮອງບໍ່ໄດ້ (ກວດສິດໂຟລເດີ backups)'); }
    fwrite($fh, "-- PTC backup " . date('Y-m-d H:i:s') . "\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n\n");
    $tables = $pdo->query("SHOW FULL TABLES WHERE Table_type='BASE TABLE'")->fetchAll(PDO::FETCH_NUM);
    foreach ($tables as $trow) {
        $t = $trow[0];
        $create = $pdo->query("SHOW CREATE TABLE `$t`")->fetch(PDO::FETCH_NUM);
        fwrite($fh, "DROP TABLE IF EXISTS `$t`;\n" . $create[1] . ";\n\n");
        $st = $pdo->query("SELECT * FROM `$t`");
        while ($r = $st->fetch(PDO::FETCH_NUM)) {
            $vals = [];
            foreach ($r as $v) { $vals[] = ($v === null) ? 'NULL' : $pdo->quote($v); }
            fwrite($fh, "INSERT INTO `$t` VALUES (" . implode(',', $vals) . ");\n");
        }
        fwrite($fh, "\n");
    }
    fwrite($fh, "SET FOREIGN_KEY_CHECKS=1;\n");
    fclose($fh);

    $all = glob(backup_dir() . DIRECTORY_SEPARATOR . 'ptc_*.sql');
    if ($all && count($all) > $keep) {
        sort($all);
        foreach (array_slice($all, 0, count($all) - $keep) as $old) { @unlink($old); }
    }
    return basename($file);
}

// ສຳຮອງອັດຕະໂນມັດ 1 ຄັ້ງ/ວັນ ຖ້າຍັງບໍ່ມີໄຟລ໌ຂອງມື້ນີ້
function auto_backup_if_needed($pdo) {
    $today = glob(backup_dir() . DIRECTORY_SEPARATOR . 'ptc_' . date('Ymd') . '_*.sql');
    if (!$today) {
        $f = make_backup($pdo);
        audit($pdo, 'backup', 'backup', null, null, null, 'auto: ' . $f);
        return $f;
    }
    return null;
}
