<?php

namespace App\Services\Evaluation;

use App\DTOs\Evaluation\EvaluationResult;
use App\Models\RubricVersion;
use App\Models\Submission;
use App\Models\TaskVersion;

interface EvaluationEngineInterface
{
    public function evaluate(
        TaskVersion $taskVersion,
        Submission $submission,
        RubricVersion $rubricVersion,
    ): EvaluationResult;
}
