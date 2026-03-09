<?php
// One-time migration script — DELETE after running
$host = 'sql111.infinityfree.com';
$db   = 'if0_41274369_karajaerp';
$user = 'if0_41274369';
$pass = 'moit2030';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("CREATE TABLE IF NOT EXISTS `units` (
        `id` bigint unsigned NOT NULL AUTO_INCREMENT,
        `name` varchar(50) NOT NULL,
        `sort_order` int NOT NULL DEFAULT 0,
        `created_at` timestamp NULL DEFAULT NULL,
        `updated_at` timestamp NULL DEFAULT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Insert defaults only if table is empty
    $count = $pdo->query("SELECT COUNT(*) FROM units")->fetchColumn();
    if ($count == 0) {
        $pdo->exec("INSERT INTO units (name, sort_order, created_at, updated_at) VALUES
            ('برميل', 0, NOW(), NOW()),
            ('جالون', 1, NOW(), NOW()),
            ('لتر',   2, NOW(), NOW()),
            ('حبة',   3, NOW(), NOW())");
        echo "✓ Units table created and seeded with 4 units.";
    } else {
        echo "✓ Units table already has $count rows. No changes made.";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
