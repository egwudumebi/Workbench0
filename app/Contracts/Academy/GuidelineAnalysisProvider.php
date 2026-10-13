<?php

namespace App\Contracts\Academy;

use App\Models\GuidelineDocument;

interface GuidelineAnalysisProvider
{
    /**
     * @return array{
     *     title: string,
     *     sections: array<int, array{heading: string, body: string, ref: string}>,
     *     rules: array<int, array{key: string, text: string, section_ref: string, category: string, importance: string, confidence: float, review_status: string}>,
     *     ambiguities: array<int, string>,
     *     objectives: array<int, string>
     * }
     */
    public function analyze(GuidelineDocument $document): array;
}
