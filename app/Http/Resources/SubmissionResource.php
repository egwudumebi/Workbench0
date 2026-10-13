<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Submission */
class SubmissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_version_id' => $this->task_version_id,
            'task_title' => $this->whenLoaded('taskVersion', fn () => $this->taskVersion->title),
            'mode' => $this->mode->value,
            'answer' => $this->answer,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'evaluation' => new EvaluationResource($this->whenLoaded('evaluation')),
        ];
    }
}
