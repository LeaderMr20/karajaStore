<?php
if (!isset($_GET['token']) || $_GET['token'] !== 'karaja2026fix') die('403');
$pdo = new PDO("mysql:host=sql111.infinityfree.com;dbname=if0_41274369_karajaerp;charset=utf8mb4",
    'if0_41274369', 'moit2030', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
header('Content-Type: text/plain; charset=utf-8');

// All products with their branch_stock per branch
$rows = $pdo->query("
    SELECT p.id, p.barcode, p.name,
        MAX(CASE WHEN bs.branch_id=1 THEN bs.quantity ELSE NULL END) as qty_muwaih,
        MAX(CASE WHEN bs.branch_id=3 THEN bs.quantity ELSE NULL END) as qty_omdoom
    FROM products p
    LEFT JOIN branch_stock bs ON bs.product_id=p.id
    GROUP BY p.id, p.barcode, p.name
    ORDER BY p.barcode
")->fetchAll(PDO::FETCH_ASSOC);

foreach ($rows as $r)
    echo $r['id']."|".$r['barcode']."|".$r['name']."|muwaih=".($r['qty_muwaih'] ?? 'NULL')."|omdoom=".($r['qty_omdoom'] ?? 'NULL')."\n";
