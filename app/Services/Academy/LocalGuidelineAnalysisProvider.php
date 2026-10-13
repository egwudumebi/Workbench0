<?php

namespace App\Services\Academy;

use App\Contracts\Academy\GuidelineAnalysisProvider;
use App\Models\GuidelineDocument;

class LocalGuidelineAnalysisProvider implements GuidelineAnalysisProvider
{
    public function analyze(GuidelineDocument $document): array
    {
        $text = $document->extracted_text ?? '';

        if ($document->ocr_required || $document->extraction_failed || trim($text) === '') {
            return [
                'title' => $document->original_filename,
                'sections' => [],
                'rules' => [],
                'ambiguities' => ['Document text could not be extracted reliably. OCR or a clearer source file may be required.'],
                'objectives' => [],
            ];
        }

        $lines = preg_split("/\r\n|\n|\r/", $text) ?: [];
        $sections = [];
        $rules = [];
        $objectives = [];
        $ambiguities = [];
        $currentHeading = 'Introduction';
        $currentBody = [];
        $sectionIndex = 0;
        $ruleIndex = 0;

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '') {
                continue;
            }

            if (preg_match('/^(#+\s+|\d+\.\s+[A-Z]|[A-Z][A-Za-z0-9\s\-]{3,40}:$)/', $trimmed)) {
                if ($currentBody !== []) {
                    $sections[] = [
                        'heading' => $currentHeading,
                        'body' => implode("\n", $currentBody),
                        'ref' => 'section-'.(++$sectionIndex),
                    ];
                    $currentBody = [];
                }
                $currentHeading = ltrim($trimmed, '# ');
                continue;
            }

            $currentBody[] = $trimmed;

            if (preg_match('/^(must|shall|should|do not|never|always|evaluators?\s+must)/i', $trimmed)) {
                $rules[] = [
                    'key' => 'rule-'.(++$ruleIndex),
                    'text' => $trimmed,
                    'section_ref' => 'section-'.$sectionIndex,
                    'category' => $this->categorize($trimmed),
                    'importance' => str_contains(strtolower($trimmed), 'must') ? 'high' : 'medium',
                    'confidence' => 0.85,
                    'review_status' => str_contains($trimmed, '?') ? 'needs_review' : 'confirmed',
                ];
            }

            if (preg_match('/^learning objective:/i', $trimmed)) {
                $objectives[] = trim((string) preg_replace('/^learning objective:\s*/i', '', $trimmed));
            }

            if (str_contains($trimmed, 'TBD') || str_contains($trimmed, 'unclear') || str_contains($trimmed, '?')) {
                $ambiguities[] = $trimmed;
            }
        }

        if ($currentBody !== []) {
            $sections[] = [
                'heading' => $currentHeading,
                'body' => implode("\n", $currentBody),
                'ref' => 'section-'.(++$sectionIndex),
            ];
        }

        if ($rules === [] && $sections !== []) {
            foreach (array_slice($sections, 0, 5) as $section) {
                $rules[] = [
                    'key' => 'rule-'.(++$ruleIndex),
                    'text' => 'Review: '.$section['heading'],
                    'section_ref' => $section['ref'],
                    'category' => 'general',
                    'importance' => 'medium',
                    'confidence' => 0.6,
                    'review_status' => 'needs_review',
                ];
            }
            $ambiguities[] = 'Local analysis produced outline rules from headings only. Review recommended before relying on scoring guidance.';
        }

        return [
            'title' => pathinfo($document->original_filename, PATHINFO_FILENAME),
            'sections' => $sections,
            'rules' => $rules,
            'ambiguities' => array_values(array_unique($ambiguities)),
            'objectives' => $objectives,
        ];
    }

    private function categorize(string $line): string
    {
        $lower = strtolower($line);

        return match (true) {
            str_contains($lower, 'rubric') || str_contains($lower, 'score') => 'scoring',
            str_contains($lower, 'accuracy') || str_contains($lower, 'fact') => 'factual_accuracy',
            str_contains($lower, 'compare') || str_contains($lower, 'response') => 'comparative',
            str_contains($lower, 'explain') || str_contains($lower, 'justif') => 'justification',
            default => 'general',
        };
    }
}
