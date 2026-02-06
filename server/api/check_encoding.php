<?php

declare(strict_types=1);

$dir = __DIR__;
$base = realpath($dir);

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS)
);

foreach ($iterator as $file) {
    if ($file->getExtension() !== 'php') {
        continue;
    }

    $path = $file->getPathname();
    $relative = str_replace('\\\\', '/', substr($path, strlen($base) + 1));

    $contents = file_get_contents($path);
    if ($contents === false) {
        echo $relative . ' | error=read_failed' . PHP_EOL;
        continue;
    }

    $hasBom = str_starts_with($contents, "\xEF\xBB\xBF");

// Fallback encoding guess without mbstring: assume UTF-8 if it passes utf8_decode round-trip,
// otherwise mark as UNKNOWN. This is conservative but enough to flag明显异常.
$utf8Decoded = utf8_decode($contents);
$utf8Encoded = utf8_encode($utf8Decoded);
$validUtf8 = ($utf8Encoded === $contents);
$enc = $validUtf8 ? 'UTF-8' : 'UNKNOWN';

    $hasCtrl = preg_match('/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]/', $contents) ? 'yes' : 'no';

    echo $relative
        . ' | enc=' . $enc
        . ' | bom=' . ($hasBom ? 'yes' : 'no')
        . ' | utf8_ok=' . ($validUtf8 ? 'yes' : 'no')
        . ' | ctrl=' . $hasCtrl
        . PHP_EOL;
}


