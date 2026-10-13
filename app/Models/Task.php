<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['project_id', 'task_type_id', 'slug', 'title', 'current_version_id', 'active'])]
class Task extends Model
{
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function taskType(): BelongsTo
    {
        return $this->belongsTo(TaskType::class);
    }

    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(TaskVersion::class, 'current_version_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(TaskVersion::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'task_skills')
            ->withPivot('weight')
            ->withTimestamps();
    }

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }
}
