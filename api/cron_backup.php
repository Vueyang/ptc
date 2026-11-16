<?php
// ແລ່ນຜ່ານ Task Scheduler (CLI ເທົ່ານັ້ນ): php.exe cron_backup.php
if (php_sapi_name() !== 'cli') { http_response_code(403); exit('CLI only'); }
require __DIR__ . '/config.php';
require __DIR__ . '/lib.php';
try {
    $pdo = db();
    $f = make_backup($pdo);
    audit($pdo, 'backup', 'backup', null, null, null, 'scheduler: ' . $f, ['id' => null, 'username' => 'system']);
    echo date('Y-m-d H:i:s') . " backup ok: $f\n";
} catch (Exception $e) {
    fwrite(STDERR, date('Y-m-d H:i:s') . ' backup failed: ' . $e->getMessage() . "\n");
    exit(1);
}
