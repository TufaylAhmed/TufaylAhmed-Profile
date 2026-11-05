<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
    exit;
}

$email = trim((string)($_POST['email'] ?? ''));
$name = trim((string)($_POST['name'] ?? ''));
$company = trim((string)($_POST['company'] ?? ''));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Please enter a valid work email.']);
    exit;
}

if (strlen($email) > 190 || strlen($name) > 120 || strlen($company) > 120) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Input too long.']);
    exit;
}

$storageDir = __DIR__ . '/storage';
$leadsFile = $storageDir . '/leads.jsonl';
$tokensFile = $storageDir . '/tokens.json';
$pdfPath = $storageDir . '/Tufail_Ahmed_Sheikh_Resume.pdf';

if (!is_dir($storageDir)) {
    mkdir($storageDir, 0750, true);
}

if (!is_file($pdfPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Resume file is not available yet.']);
    exit;
}

$lead = [
    'ts' => gmdate('c'),
    'email' => $email,
    'name' => $name,
    'company' => $company,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'ua' => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 240),
];

file_put_contents($leadsFile, json_encode($lead, JSON_UNESCAPED_SLASHES) . PHP_EOL, FILE_APPEND | LOCK_EX);

$token = bin2hex(random_bytes(24));
$tokens = [];
if (is_file($tokensFile)) {
    $raw = file_get_contents($tokensFile);
    $decoded = json_decode((string)$raw, true);
    if (is_array($decoded)) {
        $tokens = $decoded;
    }
}

$now = time();
foreach ($tokens as $key => $meta) {
    if (!isset($meta['exp']) || (int)$meta['exp'] < $now) {
        unset($tokens[$key]);
    }
}

$tokens[$token] = [
    'exp' => $now + 600,
    'email' => $email,
];

file_put_contents($tokensFile, json_encode($tokens, JSON_PRETTY_PRINT), LOCK_EX);

echo json_encode([
    'ok' => true,
    'downloadUrl' => '/api/download-resume.php?token=' . urlencode($token),
    'filename' => 'Tufail_Ahmed_Sheikh_Resume.pdf',
]);
