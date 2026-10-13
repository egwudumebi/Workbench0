<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Project */
class ProjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'instructions' => $this->instructions,
            'status' => $this->status->value,
            'current_version_id' => $this->current_version_id,
            'task_types' => TaskTypeResource::collection($this->whenLoaded('taskTypes')),
            'tasks_count' => $this->whenCounted('tasks'),
            'task_types_count' => $this->whenCounted('taskTypes'),
            'skills_count' => $this->whenCounted('skills'),
            'training_programs_count' => $this->whenCounted('trainingPrograms'),
        ];
    }
}
