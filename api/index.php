<?php
/**
 * API ລະບົບຄະນະໂຄສະນາອົບຮົມສູນກາງພັກ  (ເຟດ 2)
 * ຮູບແບບ: index.php?r=<resource>[&id=<id>]   (JSON in / JSON out)
 * resources: auth, dashboard, users*, audit*, backup*, departments, employees, categories, assets, transactions
 * (* = ສະເພາະ admin)
 */
require __DIR__ . '/config.php';
require __DIR__ . '/lib.php';
start_session();
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'];
$res    = isset($_GET['r']) ? $_GET['r'] : '';
$act    = isset($_GET['a']) ? $_GET['a'] : '';
$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$body   = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) { $body = []; }

try { $pdo = db(); }
catch (Exception $e) { fail('ເຊື່ອມຕໍ່ຖານຂໍ້ມູນບໍ່ໄດ້: ' . $e->getMessage(), 500); }

function load_me($pdo) {
    if (!isset($_SESSION['user'])) fail('ຍັງບໍ່ໄດ້ເຂົ້າລະບົບ', 401);
    $st = $pdo->prepare('SELECT id,username,full_name,role FROM users WHERE id=?');
    $st->execute([$_SESSION['user']['id']]);
    $u = $st->fetch();
    if (!$u) { session_destroy(); fail('ບັນຊີຖືກລຶບແລ້ວ', 401); }
    $u['id'] = (int)$u['id'];
    $_SESSION['user'] = $u;
    return $u;
}

/* ================= AUTH ================= */
if ($res === 'auth' && $act === 'login' && $method === 'POST') {
    // ສ້າງ admin ຄັ້ງທຳອິດຖ້າຍັງບໍ່ມີຜູ້ໃຊ້
    if ((int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() === 0) {
        $pdo->prepare('INSERT INTO users (username,password_hash,full_name,role) VALUES (?,?,?,?)')
            ->execute(['admin', password_hash('admin123', PASSWORD_DEFAULT), 'ຜູ້ດູແລລະບົບ', 'admin']);
    }
    // ກັນເດົາລະຫັດ: ເຂົ້າບໍ່ສຳເລັດ 10 ຄັ້ງໃນ 10 ນາທີ ຈາກ IP ດຽວກັນ
    $tooMany = false;
    try {
        $st = $pdo->prepare("SELECT COUNT(*) FROM audit_logs WHERE action='login_fail' AND ip=? AND created_at > (NOW() - INTERVAL 10 MINUTE)");
        $st->execute([client_ip()]);
        $tooMany = ((int)$st->fetchColumn() >= 10);
    } catch (Exception $e) { $tooMany = false; }
    if ($tooMany) fail('ພະຍາຍາມເຂົ້າລະບົບຫຼາຍເກີນໄປ ກະລຸນາລໍຖ້າ 10 ນາທີ', 429);

    $username = trim(isset($body['username']) ? (string)$body['username'] : '');
    $password = isset($body['password']) ? (string)$body['password'] : '';
    $st = $pdo->prepare('SELECT * FROM users WHERE username=?');
    $st->execute([$username]);
    $u = $st->fetch();
    if (!$u || !password_verify($password, $u['password_hash'])) {
        audit($pdo, 'login_fail', 'auth', null, null, null, $username, ['id' => null, 'username' => $username]);
        fail('ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ', 401);
    }
    session_regenerate_id(true);
    $_SESSION['user'] = ['id' => (int)$u['id'], 'username' => $u['username'], 'full_name' => $u['full_name'], 'role' => $u['role']];
    audit($pdo, 'login', 'auth', (int)$u['id'], null, null, $u['username']);
    if ($u['role'] === 'admin') { try { auto_backup_if_needed($pdo); } catch (Exception $e) { error_log($e->getMessage()); } }
    out($_SESSION['user']);
}
if ($res === 'auth' && $act === 'logout') {
    if (isset($_SESSION['user'])) { audit($pdo, 'logout', 'auth', $_SESSION['user']['id'], null, null, $_SESSION['user']['username']); }
    session_destroy();
    out(['ok' => true]);
}

$me = load_me($pdo);

if ($res === 'auth') {
    if ($act === 'password' && $method === 'POST') {
        $oldPw = isset($body['old_password']) ? (string)$body['old_password'] : '';
        $newPw = isset($body['new_password']) ? (string)$body['new_password'] : '';
        if (strlen($newPw) < 6) fail('ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ');
        $st = $pdo->prepare('SELECT password_hash FROM users WHERE id=?');
        $st->execute([$me['id']]);
        if (!password_verify($oldPw, (string)$st->fetchColumn())) fail('ລະຫັດຜ່ານເກົ່າບໍ່ຖືກຕ້ອງ');
        $pdo->prepare('UPDATE users SET password_hash=? WHERE id=?')->execute([password_hash($newPw, PASSWORD_DEFAULT), $me['id']]);
        audit($pdo, 'password_change', 'users', $me['id'], null, null, $me['username']);
        out(['ok' => true]);
    }
    out($me);
}

/* ================= USERS (admin) ================= */
if ($res === 'users') {
    need_admin($me);
    if ($method === 'GET') {
        out($pdo->query('SELECT id,username,full_name,role,created_at FROM users ORDER BY id')->fetchAll());
    }
    $roles = ['admin', 'staff'];
    $fullName = trim(isset($body['full_name']) ? (string)$body['full_name'] : '');
    $role     = isset($body['role']) ? (string)$body['role'] : 'staff';
    $pw       = isset($body['password']) ? (string)$body['password'] : '';

    if ($method === 'POST') {
        $username = trim(isset($body['username']) ? (string)$body['username'] : '');
        if (!preg_match('/^[A-Za-z0-9_.-]{3,50}$/', $username)) fail('ຊື່ຜູ້ໃຊ້ໃຊ້ໄດ້ສະເພາະ A-Z, 0-9, _ . - (3-50 ຕົວ)');
        if ($fullName === '') fail('ກະລຸນາປ້ອນຊື່ ແລະ ນາມສະກຸນ');
        if (!in_array($role, $roles, true)) fail('ບົດບາດບໍ່ຖືກຕ້ອງ');
        if (strlen($pw) < 6) fail('ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ');
        try {
            $pdo->prepare('INSERT INTO users (username,password_hash,full_name,role) VALUES (?,?,?,?)')
                ->execute([$username, password_hash($pw, PASSWORD_DEFAULT), $fullName, $role]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') fail('ຊື່ຜູ້ໃຊ້ນີ້ມີໃນລະບົບແລ້ວ', 409);
            throw $e;
        }
        $nid = (int)$pdo->lastInsertId();
        audit($pdo, 'create', 'users', $nid, null, ['username' => $username, 'full_name' => $fullName, 'role' => $role], $username);
        out(['id' => $nid], 201);
    }

    $st = $pdo->prepare('SELECT id,username,full_name,role FROM users WHERE id=?');
    $st->execute([$id]);
    $old = $st->fetch();
    if (!$old) fail('ບໍ່ພົບຜູ້ໃຊ້', 404);

    if ($method === 'PUT') {
        if ($fullName === '') fail('ກະລຸນາປ້ອນຊື່ ແລະ ນາມສະກຸນ');
        if (!in_array($role, $roles, true)) fail('ບົດບາດບໍ່ຖືກຕ້ອງ');
        if ((int)$old['id'] === $me['id'] && $role !== 'admin') fail('ບໍ່ສາມາດຫຼຸດສິດຂອງບັນຊີຕົນເອງ');
        if ($pw !== '' && strlen($pw) < 6) fail('ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ');
        $pdo->prepare('UPDATE users SET full_name=?, role=? WHERE id=?')->execute([$fullName, $role, $id]);
        $newData = ['full_name' => $fullName, 'role' => $role];
        if ($pw !== '') {
            $pdo->prepare('UPDATE users SET password_hash=? WHERE id=?')->execute([password_hash($pw, PASSWORD_DEFAULT), $id]);
            $newData['password'] = '(ຕັ້ງລະຫັດໃໝ່)';
        }
        $oldData = ['full_name' => $old['full_name'], 'role' => $old['role']];
        audit($pdo, 'update', 'users', $id, $oldData, $newData, $old['username']);
        out(['ok' => true]);
    }

    if ($method === 'DELETE') {
        if ((int)$old['id'] === $me['id']) fail('ລຶບບັນຊີຂອງຕົນເອງບໍ່ໄດ້');
        if ($old['role'] === 'admin' && (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn() <= 1) {
            fail('ຕ້ອງມີ admin ຢ່າງໜ້ອຍ 1 ຄົນ');
        }
        $pdo->prepare('DELETE FROM users WHERE id=?')->execute([$id]);
        audit($pdo, 'delete', 'users', $id, $old, null, $old['username']);
        out(['ok' => true]);
    }
    fail('ບໍ່ຮອງຮັບ', 405);
}

/* ================= AUDIT LOG ================= */
if ($res === 'audit') {
    if ($method === 'POST') {   // ບັນທຶກຜົນກວດນັບ (ທຸກຜູ້ໃຊ້)
        $summary = trim(isset($body['summary']) ? (string)$body['summary'] : 'ກວດນັບອຸປະກອນ');
        audit($pdo, 'stocktake', 'assets', null, null, isset($body['data']) ? $body['data'] : null, $summary);
        out(['ok' => true], 201);
    }
    need_admin($me);
    $w = []; $p = [];
    if (!empty($_GET['resource'])) { $w[] = 'resource=?'; $p[] = $_GET['resource']; }
    if (!empty($_GET['action']))   { $w[] = 'action=?';   $p[] = $_GET['action']; }
    if (!empty($_GET['username'])) { $w[] = 'username LIKE ?'; $p[] = '%' . $_GET['username'] . '%'; }
    if (!empty($_GET['date_from'])) { $w[] = 'created_at >= ?'; $p[] = $_GET['date_from'] . ' 00:00:00'; }
    if (!empty($_GET['date_to']))   { $w[] = 'created_at <= ?'; $p[] = $_GET['date_to'] . ' 23:59:59'; }
    $limit  = isset($_GET['limit']) ? min(500, max(1, (int)$_GET['limit'])) : 100;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;
    $sql = 'SELECT * FROM audit_logs' . ($w ? ' WHERE ' . implode(' AND ', $w) : '') . " ORDER BY id DESC LIMIT $limit OFFSET $offset";
    $st = $pdo->prepare($sql); $st->execute($p);
    out($st->fetchAll());
}

/* ================= BACKUP (admin) ================= */
if ($res === 'backup') {
    need_admin($me);
    $valid = '/^ptc_\d{8}_\d{6}\.sql$/';
    if ($method === 'GET' && $act === 'download') {
        $f = basename(isset($_GET['file']) ? $_GET['file'] : '');
        $path = backup_dir() . DIRECTORY_SEPARATOR . $f;
        if (!preg_match($valid, $f) || !is_file($path)) fail('ບໍ່ພົບໄຟລ໌', 404);
        audit($pdo, 'backup_download', 'backup', null, null, null, $f);
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $f . '"');
        header('Content-Length: ' . filesize($path));
        readfile($path);
        exit;
    }
    if ($method === 'GET') {
        $files = glob(backup_dir() . DIRECTORY_SEPARATOR . 'ptc_*.sql');
        $rows = [];
        if ($files) {
            rsort($files);
            foreach ($files as $fp) { $rows[] = ['name' => basename($fp), 'size' => filesize($fp), 'time' => date('Y-m-d H:i:s', filemtime($fp))]; }
        }
        out($rows);
    }
    if ($method === 'POST') {
        try { $f = make_backup($pdo); } catch (Exception $e) { fail($e->getMessage(), 500); }
        audit($pdo, 'backup', 'backup', null, null, null, 'manual: ' . $f);
        out(['file' => $f], 201);
    }
    if ($method === 'DELETE') {
        $f = basename(isset($_GET['file']) ? $_GET['file'] : '');
        $path = backup_dir() . DIRECTORY_SEPARATOR . $f;
        if (!preg_match($valid, $f) || !is_file($path)) fail('ບໍ່ພົບໄຟລ໌', 404);
        unlink($path);
        audit($pdo, 'backup_delete', 'backup', null, null, null, $f);
        out(['ok' => true]);
    }
    fail('ບໍ່ຮອງຮັບ', 405);
}

/* ================= DASHBOARD ================= */
if ($res === 'dashboard') {
    out([
        'totals' => $pdo->query("SELECT
            (SELECT COUNT(*) FROM departments) departments,
            (SELECT COUNT(*) FROM employees) employees,
            (SELECT COUNT(*) FROM assets WHERE status<>'disposed') assets,
            (SELECT COALESCE(SUM(price),0) FROM assets WHERE status<>'disposed') asset_value")->fetch(),
        'by_status' => $pdo->query('SELECT status, COUNT(*) n FROM assets GROUP BY status')->fetchAll(),
        'by_category' => $pdo->query("SELECT COALESCE(c.name,'ບໍ່ລະບຸ') name, COUNT(*) n FROM assets a
            LEFT JOIN asset_categories c ON c.id=a.category_id WHERE a.status<>'disposed' GROUP BY c.name ORDER BY n DESC")->fetchAll(),
        'by_department' => $pdo->query("SELECT d.id, d.seq, d.name, d.dept_type,
            (SELECT COUNT(*) FROM employees e WHERE e.department_id=d.id) employees,
            (SELECT COUNT(*) FROM assets a WHERE a.department_id=d.id AND a.status<>'disposed') assets,
            (SELECT COALESCE(SUM(price),0) FROM assets a WHERE a.department_id=d.id AND a.status<>'disposed') value
            FROM departments d ORDER BY d.seq")->fetchAll(),
        'recent' => $pdo->query("SELECT t.tx_type, t.tx_date, a.name asset_name, d.name to_department
            FROM asset_transactions t JOIN assets a ON a.id=t.asset_id
            LEFT JOIN departments d ON d.id=t.to_department_id ORDER BY t.id DESC LIMIT 6")->fetchAll(),
    ]);
}

/* ================= RESOURCE DEFINITIONS ================= */
$DEF = [
    'departments' => ['table' => 'departments', 'fields' => ['seq','code','name','dept_type','phone','note'], 'required' => ['seq','code','name','dept_type']],
    'employees'   => ['table' => 'employees', 'fields' => ['emp_code','full_name','position','phone','department_id'], 'required' => ['emp_code','full_name','department_id']],
    'categories'  => ['table' => 'asset_categories', 'fields' => ['name'], 'required' => ['name']],
    'assets'      => ['table' => 'assets', 'fields' => ['asset_code','name','category_id','brand','serial_no','purchase_date','price','status','department_id','employee_id','location','note'], 'required' => ['name']],
];

/* ================= TRANSACTIONS ================= */
if ($res === 'transactions') {
    if ($method === 'GET') {
        $w = []; $p = [];
        if (!empty($_GET['asset_id'])) { $w[] = 't.asset_id=?'; $p[] = (int)$_GET['asset_id']; }
        if (!empty($_GET['department_id'])) { $w[] = '(t.to_department_id=? OR t.from_department_id=?)'; $p[] = (int)$_GET['department_id']; $p[] = (int)$_GET['department_id']; }
        $sql = "SELECT t.*, a.asset_code, a.name asset_name, a.brand, a.serial_no, a.price,
                fd.name from_department, td.name to_department, e.full_name employee_name, u.full_name created_by_name
                FROM asset_transactions t JOIN assets a ON a.id=t.asset_id
                LEFT JOIN departments fd ON fd.id=t.from_department_id
                LEFT JOIN departments td ON td.id=t.to_department_id
                LEFT JOIN employees e ON e.id=t.employee_id
                LEFT JOIN users u ON u.id=t.created_by"
             . ($w ? ' WHERE ' . implode(' AND ', $w) : '') . ' ORDER BY t.tx_date DESC, t.id DESC LIMIT 300';
        $st = $pdo->prepare($sql); $st->execute($p);
        out($st->fetchAll());
    }
    if ($method !== 'POST') fail('ບໍ່ຮອງຮັບ', 405);

    $type = isset($body['tx_type']) ? $body['tx_type'] : '';
    $aid  = (int)(isset($body['asset_id']) ? $body['asset_id'] : 0);
    $to   = !empty($body['to_department_id']) ? (int)$body['to_department_id'] : null;
    $emp  = !empty($body['employee_id']) ? (int)$body['employee_id'] : null;
    $date = !empty($body['tx_date']) ? $body['tx_date'] : date('Y-m-d');
    if (!in_array($type, ['assign','return','transfer','repair','dispose'], true)) fail('ປະເພດລາຍການບໍ່ຖືກຕ້ອງ');
    if (in_array($type, ['assign','transfer'], true) && !$to) fail('ກະລຸນາເລືອກກົມປາຍທາງ');

    $pdo->beginTransaction();
    try {
        $st = $pdo->prepare('SELECT * FROM assets WHERE id=? FOR UPDATE'); $st->execute([$aid]);
        $a = $st->fetch();
        if (!$a) { $pdo->rollBack(); fail('ບໍ່ພົບອຸປະກອນ', 404); }
        if ($a['status'] === 'disposed') { $pdo->rollBack(); fail('ອຸປະກອນນີ້ຖືກຕັດບັນຊີແລ້ວ'); }

        $dept = $a['department_id']; $status = $a['status']; $newEmp = $a['employee_id'];
        switch ($type) {
            case 'assign':   $dept = $to; $newEmp = $emp; $status = 'in_use'; break;
            case 'transfer': $dept = $to; $newEmp = $emp; break;
            case 'return':   $newEmp = null; $status = 'in_stock'; break;
            case 'repair':   $status = 'repair'; break;
            case 'dispose':  $newEmp = null; $status = 'disposed'; break;
        }
        $pdo->prepare('UPDATE assets SET department_id=?, employee_id=?, status=? WHERE id=?')->execute([$dept, $newEmp, $status, $aid]);
        $pdo->prepare('INSERT INTO asset_transactions (asset_id,tx_type,from_department_id,to_department_id,employee_id,tx_date,note,created_by) VALUES (?,?,?,?,?,?,?,?)')
            ->execute([$aid, $type, $a['department_id'], $dept, $newEmp, $date, isset($body['note']) ? $body['note'] : null, $me['id']]);
        $txId = (int)$pdo->lastInsertId();
        audit($pdo, 'transaction', 'assets', $aid,
            ['status' => $a['status'], 'department_id' => $a['department_id'], 'employee_id' => $a['employee_id']],
            ['tx_type' => $type, 'status' => $status, 'department_id' => $dept, 'employee_id' => $newEmp],
            $a['asset_code'] . ' ' . $type);
        $pdo->commit();
        out(['ok' => true, 'id' => $txId], 201);
    } catch (Exception $e) { if ($pdo->inTransaction()) $pdo->rollBack(); fail('ບັນທຶກບໍ່ສຳເລັດ: ' . $e->getMessage(), 500); }
}

/* ================= GENERIC CRUD ================= */
if (!isset($DEF[$res])) fail('ບໍ່ພົບ resource', 404);
$d = $DEF[$res]; $t = $d['table'];

function selectSql($res, &$p) {
    $w = [];
    $q = trim(isset($_GET['q']) ? $_GET['q'] : '');
    switch ($res) {
        case 'departments':
            return "SELECT d.*, (SELECT COUNT(*) FROM employees e WHERE e.department_id=d.id) emp_count,
                    (SELECT COUNT(*) FROM assets a WHERE a.department_id=d.id AND a.status<>'disposed') asset_count
                    FROM departments d ORDER BY d.seq";
        case 'employees':
            if ($q !== '') { $w[] = '(e.full_name LIKE ? OR e.emp_code LIKE ? OR e.position LIKE ?)'; array_push($p, "%$q%", "%$q%", "%$q%"); }
            if (!empty($_GET['department_id'])) { $w[] = 'e.department_id=?'; $p[] = (int)$_GET['department_id']; }
            return 'SELECT e.*, d.name department_name FROM employees e JOIN departments d ON d.id=e.department_id'
                 . ($w ? ' WHERE ' . implode(' AND ', $w) : '') . ' ORDER BY d.seq, e.full_name';
        case 'categories':
            return 'SELECT c.*, (SELECT COUNT(*) FROM assets a WHERE a.category_id=c.id) asset_count FROM asset_categories c ORDER BY c.name';
        case 'assets':
            if ($q !== '') { $w[] = '(a.name LIKE ? OR a.asset_code LIKE ? OR a.serial_no LIKE ?)'; array_push($p, "%$q%", "%$q%", "%$q%"); }
            foreach (['department_id', 'category_id'] as $f) {
                if (!empty($_GET[$f])) { $w[] = "a.$f=?"; $p[] = (int)$_GET[$f]; }
            }
            if (!empty($_GET['status'])) { $w[] = 'a.status=?'; $p[] = $_GET['status']; }
            return 'SELECT a.*, c.name category_name, d.name department_name, e.full_name employee_name FROM assets a
                    LEFT JOIN asset_categories c ON c.id=a.category_id
                    LEFT JOIN departments d ON d.id=a.department_id
                    LEFT JOIN employees e ON e.id=a.employee_id'
                 . ($w ? ' WHERE ' . implode(' AND ', $w) : '') . ' ORDER BY a.id DESC';
    }
    return '';
}

function fetch_row($pdo, $t, $id) {
    $st = $pdo->prepare("SELECT * FROM `$t` WHERE id=?");
    $st->execute([$id]);
    return $st->fetch();
}

try {
    if ($method === 'GET') {
        if ($id) {
            $row = fetch_row($pdo, $t, $id);
            if ($row) out($row);
            fail('ບໍ່ພົບຂໍ້ມູນ', 404);
        }
        $p = [];
        $st = $pdo->prepare(selectSql($res, $p)); $st->execute($p);
        out($st->fetchAll());
    }

    if ($method === 'DELETE') {
        need_admin($me);
        $old = fetch_row($pdo, $t, $id);
        if (!$old) fail('ບໍ່ພົບຂໍ້ມູນ', 404);
        $pdo->prepare("DELETE FROM `$t` WHERE id=?")->execute([$id]);
        audit($pdo, 'delete', $res, $id, $old, null, label_of($old));
        out(['ok' => true]);
    }

    if ($method === 'POST' || $method === 'PUT') {
        $vals = [];
        foreach ($d['fields'] as $f) {
            if (!array_key_exists($f, $body)) continue;
            $v = is_string($body[$f]) ? trim($body[$f]) : $body[$f];
            if ($v === '' && in_array($f, $d['required'], true)) fail("ກະລຸນາປ້ອນຂໍ້ມູນ: $f");
            $vals[$f] = ($v === '') ? null : $v;
        }
        if ($res === 'assets' && !empty($vals['asset_code'])) {
            $vals['asset_code'] = strtoupper($vals['asset_code']);
            if (!preg_match('/^[A-Z0-9 .\-]+$/', $vals['asset_code'])) fail('ລະຫັດອຸປະກອນໃຊ້ໄດ້ສະເພາະ A-Z, 0-9, ຂີດ (-), ຈຸດ (.) ແລະ ຍະຫວ່າງ ເພື່ອພິມບາໂຄດໄດ້');
        }

        if ($method === 'POST') {
            foreach ($d['required'] as $f) {
                if (!isset($vals[$f]) || $vals[$f] === '') fail("ກະລຸນາປ້ອນຂໍ້ມູນ: $f");
            }
            if ($res === 'assets' && empty($vals['asset_code'])) {
                $next = (int)$pdo->query('SELECT COALESCE(MAX(id),0)+1 FROM assets')->fetchColumn();
                $vals['asset_code'] = sprintf('AST-%s-%04d', date('y'), $next);
            }
            $cols = implode(',', array_map(function ($c) { return "`$c`"; }, array_keys($vals)));
            $qs = implode(',', array_fill(0, count($vals), '?'));
            $pdo->prepare("INSERT INTO `$t` ($cols) VALUES ($qs)")->execute(array_values($vals));
            $nid = (int)$pdo->lastInsertId();
            audit($pdo, 'create', $res, $nid, null, $vals, label_of($vals));
            out(['id' => $nid], 201);
        }

        if (!$id) fail('ຕ້ອງລະບຸ id');
        if (!$vals) fail('ບໍ່ມີຂໍ້ມູນທີ່ຈະແກ້ໄຂ');
        $old = fetch_row($pdo, $t, $id);
        if (!$old) fail('ບໍ່ພົບຂໍ້ມູນ', 404);
        $set = implode(',', array_map(function ($c) { return "`$c`=?"; }, array_keys($vals)));
        $params = array_values($vals); $params[] = $id;
        $pdo->prepare("UPDATE `$t` SET $set WHERE id=?")->execute($params);
        $chgOld = []; $chgNew = [];
        foreach ($vals as $k => $v) {
            if (!same_val($old[$k], $v)) { $chgOld[$k] = $old[$k]; $chgNew[$k] = $v; }
        }
        if ($chgNew) audit($pdo, 'update', $res, $id, $chgOld, $chgNew, label_of($old));
        out(['ok' => true]);
    }
    fail('ບໍ່ຮອງຮັບ', 405);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        $dup = (strpos($e->getMessage(), 'Duplicate') !== false);
        fail($dup ? 'ລະຫັດ/ຊື່ນີ້ມີໃນລະບົບແລ້ວ' : 'ລຶບ ຫຼື ບັນທຶກບໍ່ໄດ້ ເພາະມີຂໍ້ມູນທີ່ກ່ຽວຂ້ອງ', 409);
    }
    fail('ຜິດພາດຖານຂໍ້ມູນ: ' . $e->getMessage(), 500);
}
