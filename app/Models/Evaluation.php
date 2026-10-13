<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'submission_id',
    'project_version_id',
    'task_version_id',
    'rubric_version_id',
    'evaluation_engine',
    'evaluation_engine_version',
    'evaluation_rules_version',
    'score',
    'passed',
    'decision_correct',
    'result_payload',
    'provider',
    'model',
    'prompt_version',
    'input_hash',
    'output_hash',
    'latency_ms',
    'token_usage',
])]
class Evaluation extends Model
{
    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function criterionScores(): HasMany
    {
        return $this->hasMany(EvaluationCriterionScore::class);
    }

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'passed' => 'boolean',
            'decision_correct' => 'boolean',
            'result_payload' => 'array',
        ];
    }
}
