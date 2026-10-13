<?php

namespace App\Http\Resources;

use App\Support\TaskTypeSchema;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TaskType */
class TaskTypeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'schema' => TaskTypeSchema::withDisplay($this->schema ?? [], $this->slug),
        ];
    }
}
