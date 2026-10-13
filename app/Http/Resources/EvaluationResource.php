<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Evaluation */
class EvaluationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $payload = $this->result_payload;

        return [
            'id' => $this->id,
            'score' => (float) $this->score,
            'passed' => $this->passed,
            'decision_correct' => $this->decision_correct,
            'result_label' => $payload['result_label'] ?? null,
            'criterion_scores' => $this->whenLoaded('criterionScores', fn () => $this->criterionScores->map(fn ($c) => [
                'criterion' => $c->criterion_name,
                'score' => (float) $c->score,
                'weight' => $c->weight,
                'passed' => $c->passed,
                'reason' => $c->reason,
            ])),
            'mistakes' => $payload['mistakes'] ?? [],
            'feedback' => $payload['feedback'] ?? null,
        ];
    }
}
