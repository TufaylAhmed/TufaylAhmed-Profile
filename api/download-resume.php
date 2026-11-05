<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$token = trim((string)($_GET['token'] ?? ''));
if ($token === '' || !preg_match('/^[a-f0-9]{48}$/', $token)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Invalid download link.';
    exit;
}

$storageDir = __DIR__ . '/storage';
$tokensFile = $storageDir . '/tokens.json';
$pdfPath = $storageDir . '/Tufail_Ahmed_Sheikh_Resume.pdf';

if (!is_file($tokensFile) || !is_file($pdfPath)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Download unavailable.';
    exit;
}

$tokens = json_decode((string)file_get_contents($tokensFile), true);
if (!is_array($tokens) || !isset($tokens[$token])) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'This download link has expired. Please request the resume again.';
    exit;
}

$meta = $tokens[$token];
if (!isset($meta['exp']) || (int)$meta['exp'] < time()) {
    unset($tokens[$token]);
    file_put_contents($tokensFile, json_encode($tokens, JSON_PRETTY_PRINT), LOCK_EX);
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'This download link has expired. Please request the resume again.';
    exit;
}

// One-time token
unset($tokens[$token]);
file_put_contents($tokensFile, json_encode($tokens, JSON_PRETTY_PRINT), LOCK_EX);

$filename = 'Tufail_Ahmed_Sheikh_Resume.pdf';
header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . (string)filesize($pdfPath));
readfile($pdfPath);
exit;
