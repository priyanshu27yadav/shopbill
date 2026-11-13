<?php
require 'backend/vendor/autoload.php';
$parser = new \Smalot\PdfParser\Parser();
$pdf = $parser->parseFile('sample_data/sample_price_list.pdf');
echo "Raw text length: " . strlen($pdf->getText()) . "\n";
echo "Raw text:\n" . $pdf->getText() . "\n";
unlink(__FILE__);
