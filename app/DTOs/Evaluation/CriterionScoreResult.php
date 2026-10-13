<?php

namespace App\DTOs\Evaluation;

readonly class CriterionScoreResult
{
    public function __construct(
        public string $criterion,
        public float $score,
        public int $weight,
        public bool $passed,
        public ?string $reason = null,
        public ?int $rubricCriterionId = null,
    ) {}

    public function toArray(): array
    {
        return [
            'criterion' => $this->criterion,
            'score' => $this->score,
            'weight' => $this->weight,
            'passed' => $this->passed,
            'reason' => $this->reason,
            'rubric_criterion_id' => $this->rubricCriterionId,
        ];
    }
}
