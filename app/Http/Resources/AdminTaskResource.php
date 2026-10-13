<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Task */
class AdminTaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'active' => $this->active,
            'project' => $this->whenLoaded('project', fn () => [
                'id' => $this->project->id,
                'name' => $this->project->name,
                'slug' => $this->project->slug,
            ]),
            'task_type' => $this->whenLoaded('taskType', fn () => [
                'id' => $this->taskType->id,
                'name' => $this->taskType->name,
                'slug' => $this->taskType->slug,
            ]),
            'current_version' => $this->whenLoaded('currentVersion', fn () => [
                'id' => $this->currentVersion->id,
                'title' => $this->currentVersion->title,
                'difficulty' => $this->currentVersion->difficulty->value,
                'expected_output' => $this->currentVersion->expected_output,
                'configuration' => $this->currentVersion->configuration,
                'prompt' => $this->currentVersion->prompt,
                'response_a' => $this->currentVersion->response_a,
                'response_b' => $this->currentVersion->response_b,
            ]),
        ];
    }
}
