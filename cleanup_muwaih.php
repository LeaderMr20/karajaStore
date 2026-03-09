<?php
if (!isset($_GET['token']) || $_GET['token'] !== 'karaja2026fix') die('403');
$pdo = new PDO("mysql:host=sql111.infinityfree.com;dbname=if0_41274369_karajaerp;charset=utf8mb4",
    'if0_41274369', 'moit2030', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
header('Content-Type: text/plain; charset=utf-8');

// Delete all branch_stock entries for branch 1 (Muwaih) - they were wrong
$n = $pdo->exec("DELETE FROM branch_stock WHERE branch_id = 1");
echo "Deleted $n rows from branch 1 (Muwaih) - ready for correct data";
