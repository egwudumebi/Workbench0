<?php

namespace App\Models;

use App\Enums\DifficultyLevel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable([
    'task_id',
    'project_version_id',
    'version_number',
    'title',
    'prompt',
    'context',
    'response_a',
    'response_b',
    'configuration',
    'expected_output',
    'difficulty',
    'active',
])]
class TaskVersion extends Model
{
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function projectVersion(): BelongsTo
    {
        return $this->belongsTo(ProjectVersion::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'task_skills', 'task_id', 'skill_id', 'task_id')
            ->withPivot('weight')
            ->withTimestamps();
    }

    protected function casts(): array
    {
        return [
            'context' => 'array',
            'configuration' => 'array',
            'expected_output' => 'array',
            'difficulty' => DifficultyLevel::class,
            'active' => 'boolean',
        ];
    }
}
