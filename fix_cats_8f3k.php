<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

if (!isset($_GET['token']) || $_GET['token'] !== 'karaja2026fix') {
    die('403 Forbidden');
}

$pdo = new PDO(
    "mysql:host=sql111.infinityfree.com;dbname=if0_41274369_karajaerp;charset=utf8mb4",
    'if0_41274369', 'moit2030',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
echo "Connected OK<br>\n";

// ── 1. Remove demo products (non-MUW barcodes) ──────────────────────────────
$pdo->exec("DELETE FROM branch_stocks WHERE product_id IN (SELECT id FROM products WHERE barcode NOT LIKE 'MUW%')");
$n = $pdo->exec("DELETE FROM products WHERE barcode NOT LIKE 'MUW%'");
echo "Deleted demo products: $n<br>\n";

// ── 2. Remove all existing categories ───────────────────────────────────────
$pdo->exec("UPDATE products SET category_id = NULL");
$pdo->exec("DELETE FROM categories");
echo "Cleared old categories<br>\n";

// ── 3. Insert new categories ─────────────────────────────────────────────────
$ins = $pdo->prepare("INSERT INTO categories (name, name_en, created_at, updated_at) VALUES (?, ?, NOW(), NOW())");

$ins->execute(['دهانات', 'Paints']);               $paintId  = (int)$pdo->lastInsertId();
$ins->execute(['تلوينات', 'Color Tints']);          $tintsId  = (int)$pdo->lastInsertId();
$ins->execute(['أدوات الدهان', 'Painting Tools']);  $toolsId  = (int)$pdo->lastInsertId();
$ins->execute(['دهانات خشب وورنيش', 'Wood Paints & Varnish']); $woodId = (int)$pdo->lastInsertId();
$ins->execute(['مواد عازلة وإيبوكسي', 'Sealants & Epoxy']);    $sealId = (int)$pdo->lastInsertId();

echo "Created categories: Paint=$paintId Tints=$tintsId Tools=$toolsId Wood=$woodId Seal=$sealId<br>\n";

// ── 4. Assign by barcode ──────────────────────────────────────────────────────

// Tints: MUW070–090, 121, 170
$tintsBarcodes = array_merge(
    array_map(fn($i) => 'MUW' . str_pad($i, 3, '0', STR_PAD_LEFT), range(70, 90)),
    ['MUW121', 'MUW170']
);
$ph = implode(',', array_fill(0, count($tintsBarcodes), '?'));
$stmt = $pdo->prepare("UPDATE products SET category_id=$tintsId WHERE barcode IN ($ph)");
$stmt->execute($tintsBarcodes);
echo "Tints: " . $stmt->rowCount() . "<br>\n";

// Painting Tools
$toolsBarcodes = [
    'MUW091','MUW092','MUW093','MUW094','MUW095','MUW096','MUW097','MUW099',
    'MUW101','MUW102','MUW103','MUW104','MUW105','MUW106','MUW107','MUW108',
    'MUW109','MUW110','MUW111','MUW112','MUW113','MUW125','MUW127','MUW128',
    'MUW132','MUW135','MUW138','MUW140','MUW141','MUW142','MUW143','MUW147',
    'MUW151','MUW152','MUW159','MUW160'
];
$ph = implode(',', array_fill(0, count($toolsBarcodes), '?'));
$stmt = $pdo->prepare("UPDATE products SET category_id=$toolsId WHERE barcode IN ($ph)");
$stmt->execute($toolsBarcodes);
echo "Tools: " . $stmt->rowCount() . "<br>\n";

// Wood Paints & Varnish
$woodBarcodes = [
    'MUW058','MUW059','MUW060','MUW061','MUW114','MUW115','MUW116','MUW117',
    'MUW134','MUW155','MUW156','MUW157','MUW161'
];
$ph = implode(',', array_fill(0, count($woodBarcodes), '?'));
$stmt = $pdo->prepare("UPDATE products SET category_id=$woodId WHERE barcode IN ($ph)");
$stmt->execute($woodBarcodes);
echo "Wood: " . $stmt->rowCount() . "<br>\n";

// Sealants & Epoxy
$sealBarcodes = [
    'MUW118','MUW119','MUW120','MUW123','MUW124','MUW126','MUW129','MUW130',
    'MUW131','MUW148','MUW149','MUW150','MUW163','MUW164','MUW165','MUW166',
    'MUW167','MUW168','MUW169'
];
$ph = implode(',', array_fill(0, count($sealBarcodes), '?'));
$stmt = $pdo->prepare("UPDATE products SET category_id=$sealId WHERE barcode IN ($ph)");
$stmt->execute($sealBarcodes);
echo "Sealants: " . $stmt->rowCount() . "<br>\n";

// Everything else MUW → Paints
$n = $pdo->exec("UPDATE products SET category_id=$paintId WHERE barcode LIKE 'MUW%' AND category_id IS NULL");
echo "Paints (remaining): $n<br>\n";

// ── 5. Summary ───────────────────────────────────────────────────────────────
echo "<br><strong>Summary:</strong><br>\n";
$rows = $pdo->query("SELECT c.name, COUNT(p.id) as cnt FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "- {$r['name']}: {$r['cnt']} products<br>\n";
}
echo "<br><strong>DONE!</strong>\n";
