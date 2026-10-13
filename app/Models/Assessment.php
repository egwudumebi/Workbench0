<?php

namespace App\Models;

use App\Enums\AssessmentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'project_id',
    'project_version_id',
    'status',
    'task_count',
    'time_limit_minutes',
    'started_at',
    'completed_at',
    'score',
    'passed',
])]
class Assessment extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assessmentTasks(): HasMany
    {
        return $this->hasMany(AssessmentTask::class);
    }

    public function assessmentSubmissions(): HasMany
    {
        return $this->hasMany(AssessmentSubmission::class);
    }

    protected function casts(): array
    {
        return [
            'status' => AssessmentStatus::class,
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'score' => 'decimal:2',
            'passed' => 'boolean',
        ];
    }
}
