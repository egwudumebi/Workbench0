<?php

namespace App\Contracts\Academy;

use App\Models\Academy;
use App\Models\GuidelineDocument;

interface CurriculumGenerationProvider
{
    /**
     * @param  array<string, mixed>  $analysis
     * @return array{
     *     modules: array<int, array<string, mixed>>,
     *     lessons: array<int, array<string, mixed>>,
     *     learning_graph: array<int, array<string, mixed>>,
     *     ambiguities: array<int, string>
     * }
     */
    public function generate(Academy $academy, GuidelineDocument $document, array $analysis): array;
}
