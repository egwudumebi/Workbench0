<?php

namespace App\Services\Academy;

use Illuminate\Http\UploadedFile;
use Smalot\PdfParser\Parser as PdfParser;
use ZipArchive;

class GuidelineTextExtractor
{
    /**
     * @return array{text: string, ocr_required: bool, failed: bool}
     */
    public function extract(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        return match ($extension) {
            'txt' => $this->fromText($file),
            'pdf' => $this->fromPdf($file),
            'docx' => $this->fromDocx($file),
            default => ['text' => '', 'ocr_required' => false, 'failed' => true],
        };
    }

    /**
     * @return array{text: string, ocr_required: bool, failed: bool}
     */
    public function extractFromPath(string $path, string $extension): array
    {
        $extension = strtolower($extension);

        if ($extension === 'txt') {
            $text = trim((string) file_get_contents($path));

            return [
                'text' => $text,
                'ocr_required' => false,
                'failed' => $text === '',
            ];
        }

        if ($extension === 'pdf' && class_exists(PdfParser::class)) {
            try {
                $parser = new PdfParser;
                $pdf = $parser->parseFile($path);
                $text = trim($pdf->getText());

                return [
                    'text' => $text,
                    'ocr_required' => $text === '',
                    'failed' => $text === '',
                ];
            } catch (\Throwable) {
                return ['text' => '', 'ocr_required' => true, 'failed' => true];
            }
        }

        return ['text' => '', 'ocr_required' => false, 'failed' => true];
    }

    private function fromText(UploadedFile $file): array
    {
        $text = trim($file->get());

        return [
            'text' => $text,
            'ocr_required' => false,
            'failed' => $text === '',
        ];
    }

    private function fromPdf(UploadedFile $file): array
    {
        return $this->extractFromPath($file->getRealPath(), 'pdf');
    }

    private function fromDocx(UploadedFile $file): array
    {
        $zip = new ZipArchive;
        if ($zip->open($file->getRealPath()) !== true) {
            return ['text' => '', 'ocr_required' => false, 'failed' => true];
        }

        $xml = $zip->getFromName('word/document.xml');
        $zip->close();

        if (! $xml) {
            return ['text' => '', 'ocr_required' => false, 'failed' => true];
        }

        $text = trim(strip_tags(str_replace(['<w:p>', '</w:p>'], ["\n", "\n"], $xml)));

        return [
            'text' => $text,
            'ocr_required' => false,
            'failed' => $text === '',
        ];
    }
}
