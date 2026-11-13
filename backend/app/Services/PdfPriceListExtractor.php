<?php

namespace App\Services;

use Smalot\PdfParser\Parser;
use Exception;
use Illuminate\Support\Facades\Log;

class PdfPriceListExtractor
{
    protected Parser $parser;

    public function __construct()
    {
        $this->parser = new Parser();
    }

    /**
     * Extract product items from an uploaded PDF file.
     */
    public function extract(string $pdfPath, array $availableCategories = []): array
    {
        $rawText = '';
        try {
            $pdf = $this->parser->parseFile($pdfPath);
            $pages = $pdf->getPages();
            foreach ($pages as $page) {
                $rawText .= $page->getText() . "\n";
            }
        } catch (Exception $e) {
            if (class_exists(\Illuminate\Support\Facades\Log::class) && function_exists('app') && app()->bound('log')) {
                Log::warning("PDF parser failed: " . $e->getMessage());
            } else {
                error_log("PDF parser failed: " . $e->getMessage());
            }
        }

        if (strlen(trim($rawText)) < 30) {
            $rawText = $this->attemptOcrFallback($pdfPath);
        }

        return $this->parseExtractedText($rawText, $availableCategories);
    }

    /**
     * OCR fallback for scanned/image PDFs using Tesseract if installed.
     */
    protected function attemptOcrFallback(string $pdfPath): string
    {
        try {
            $cmd = "tesseract " . escapeshellarg($pdfPath) . " stdout --oem 1 -l eng 2>nul";
            $output = shell_exec($cmd);
            if (!empty($output) && strlen(trim($output)) > 20) {
                return $output;
            }
        } catch (Exception $e) {
            // Ignore
        }

        return '';
    }

    /**
     * Parse raw extracted text lines into structured item rows.
     */
    public function parseExtractedText(string $text, array $availableCategories = []): array
    {
        $lines = preg_split("/\r\n|\n|\r/", $text);
        $extractedItems = [];
        $currentCategory = !empty($availableCategories) ? $availableCategories[0] : 'General';

        $units = [
            'kg' => ['kg', 'kgs', 'kilo', 'kilogram'],
            'g' => ['gm', 'gms', 'gram', 'grams', 'g'],
            'L' => ['ltr', 'litre', 'litres', 'liter', 'l'],
            'ml' => ['ml', 'milli'],
            'pcs' => ['pcs', 'pc', 'piece', 'pieces', 'nos', 'no'],
            'pkt' => ['pkt', 'packet', 'pack', 'pkts'],
            'box' => ['box', 'boxes'],
            'dz' => ['dz', 'doz', 'dozen'],
            'm' => ['mtr', 'meter', 'metre', 'm'],
        ];

        $categoryKeywords = [
            'Grocery' => ['rice', 'dal', 'oil', 'flour', 'atta', 'sugar', 'salt', 'spice', 'chilli', 'ghee', 'almond', 'grocery'],
            'Electronics' => ['cable', 'charger', 'bulb', 'led', 'adapter', 'wire', 'mouse', 'hdmi', 'plug', 'cord', 'electronics'],
            'Clothing' => ['shirt', 't-shirt', 'pant', 'jeans', 'trousers', 'cotton', 'clothing', 'garment', 'socks'],
            'Footwear' => ['shoes', 'slipper', 'sandal', 'flip flop', 'boots', 'footwear'],
            'Hardware' => ['tool', 'screw', 'tape', 'lock', 'pipe', 'wrench', 'screwdriver', 'hardware', 'nail', 'hammer'],
            'Cosmetics' => ['soap', 'shampoo', 'cream', 'lotion', 'face wash', 'perfume', 'cosmetic'],
            'Stationery' => ['pen', 'notebook', 'pencil', 'paper', 'register', 'diary', 'file', 'folder', 'notes', 'stationery', 'marker'],
            'Beverages & Snacks' => ['biscuit', 'tea', 'coffee', 'juice', 'cookie', 'butter', 'milk', 'chocolate'],
        ];

        foreach ($lines as $lineIndex => $line) {
            $line = trim($line);
            if (empty($line) || strlen($line) < 4) {
                continue;
            }

            // Skip page headers, footers, phone numbers, addresses
            if (preg_match('/^(page|price list|sl\.?no|s\.no|item description|rate|effective from|gstin|phone|email)/i', $line)) {
                continue;
            }

            // Category Header detection (e.g. CATEGORY: GROCERY or GROCERY ITEMS)
            if (preg_match('/^(CATEGORY\s*:\s*)?([A-Z\s&]{3,35})(?:\s+ITEMS)?$/i', $line, $catMatch) && !preg_match('/\d/', $line)) {
                $potentialCategory = trim(ucwords(strtolower(trim($catMatch[2]))));
                if (strlen($potentialCategory) > 2) {
                    $currentCategory = $potentialCategory;
                    continue;
                }
            }

            // 1. Extract GST Rate first (e.g. 0%, 5%, 12%, 18%, 28%)
            $gstRate = 0.0;
            $workLine = $line;
            if (preg_match('/(\b(0|5|12|18|28)\s*%)/i', $workLine, $gstMatch)) {
                $gstRate = floatval($gstMatch[2]);
                $workLine = str_replace($gstMatch[1], ' ', $workLine);
            }

            // 2. Extract HSN code (4 to 8 digits, often preceded by HSN)
            $hsnCode = null;
            if (preg_match('/\b(?:HSN\s*[:\-]?)?\s*([1-9][0-9]{3,7})\b/i', $workLine, $hsnMatch)) {
                $hsnCode = $hsnMatch[1];
                $workLine = preg_replace('/\b(?:HSN\s*[:\-]?)?\s*' . preg_quote($hsnCode, '/') . '\b/i', ' ', $workLine);
            }

            // 3. Extract Unit
            $detectedUnit = 'pcs';
            foreach ($units as $code => $aliases) {
                foreach ($aliases as $alias) {
                    if (preg_match('/\b' . preg_quote($alias, '/') . '\b/i', $workLine)) {
                        $detectedUnit = $code;
                        $workLine = preg_replace('/\b' . preg_quote($alias, '/') . '\b/i', ' ', $workLine);
                        break 2;
                    }
                }
            }

            // 4. Extract Price: look for decimal numbers (e.g. 135.00, 340.00) or currency symbols
            $foundPrice = null;
            if (preg_match('/(?:₹|Rs\.?|INR)?\s*([0-9]+\.[0-9]{2})\b/', $workLine, $pMatch)) {
                $foundPrice = floatval($pMatch[1]);
                $workLine = str_replace($pMatch[0], ' ', $workLine);
            } elseif (preg_match_all('/\b([0-9]+(?:\.[0-9]{1,2})?)\b/', $workLine, $allNums)) {
                // Pick reasonable number
                foreach (array_reverse($allNums[1]) as $candidate) {
                    $v = floatval($candidate);
                    if ($v > 0 && $v < 100000 && $v != 2026 && $v != 2025) {
                        $foundPrice = $v;
                        $workLine = preg_replace('/\b' . preg_quote($candidate, '/') . '\b/', ' ', $workLine, 1);
                        break;
                    }
                }
            }

            if ($foundPrice === null || $foundPrice <= 0) {
                continue;
            }

            // 5. Clean Item Name
            $cleanName = preg_replace('/^\s*\d+[\.\)\-\s]+/', '', $workLine); // remove leading S.No
            $cleanName = preg_replace('/[\/\-\:\,\%]+/', ' ', $cleanName); // remove punctuation
            $cleanName = trim(preg_replace('/\s+/', ' ', $cleanName));

            if (strlen($cleanName) < 2) {
                continue;
            }

            // 6. Match category by keyword
            $matchedCategory = $currentCategory;
            foreach ($categoryKeywords as $catName => $keywords) {
                foreach ($keywords as $kw) {
                    if (stripos($cleanName, $kw) !== false) {
                        $matchedCategory = $catName;
                        break 2;
                    }
                }
            }

            // 7. Confidence Score
            $confidence = 0.95;
            $uncertainPrice = false;

            if ($foundPrice < 1 || $foundPrice > 50000) {
                $confidence -= 0.35;
                $uncertainPrice = true;
            }
            if (strlen($cleanName) < 4) {
                $confidence -= 0.20;
            }

            $extractedItems[] = [
                'temp_id' => 'tmp_' . uniqid(),
                'line_number' => $lineIndex + 1,
                'name' => $cleanName,
                'category' => $matchedCategory,
                'unit' => $detectedUnit,
                'default_price' => number_format($foundPrice, 2, '.', ''),
                'mrp' => number_format($foundPrice, 2, '.', ''),
                'gst_rate' => $gstRate,
                'hsn_code' => $hsnCode,
                'confidence' => round(max(0.2, min(1.0, $confidence)), 2),
                'uncertain_price' => $uncertainPrice,
                'raw_line' => $line,
            ];
        }

        return $extractedItems;
    }
}
