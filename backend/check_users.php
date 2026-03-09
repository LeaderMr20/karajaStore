<?php
$db = new PDO('sqlite:database/database.sqlite');
$stmt = $db->query('SELECT id, name, email, role, branch_id, is_active FROM users');
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo implode(' | ', array_map(fn($v) => $v ?? 'NULL', $row)) . PHP_EOL;
}
