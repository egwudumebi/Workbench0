<?php

namespace App\DTOs\Evaluation;

readonly class EvaluationResult
{
    /**
     * @param  array<int, CriterionScoreResult>  $criterionScores
     * @param  array<int, MistakeResult>  $mistakes
     */
    public function __construct(
        public float $score,
        public bool $passed,
        public bool $decisionCorrect,
        public string $resultLabel,
        public array $criterionScores,
        public array $mistakes,
        public FeedbackResult $feedback,
    ) {}

    public function toArray(): array
    {
        return [
            'score' => $this->score,
            'passed' => $this->passed,
            'decision_correct' => $this->decisionCorrect,
            'result_label' => $this->resultLabel,
            'criterion_scores' => array_map(fn (CriterionScoreResult $c) => $c->toArray(), $this->criterionScores),
            'mistakes' => array_map(fn (MistakeResult $m) => $m->toArray(), $this->mistakes),
            'feedback' => $this->feedback->toArray(),
        ];
    }
}
