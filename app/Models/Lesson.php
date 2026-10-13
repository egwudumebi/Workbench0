<?php

namespace App\Models;

use App\Enums\LessonStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'project_id', 'project_version_id', 'training_program_id', 'training_module_id',
    'title', 'slug', 'summary', 'content', 'sort_order', 'status', 'estimated_minutes',
    'video_url', 'caption_url', 'transcript', 'learning_objectives', 'completion_criteria',
])]
class Lesson extends Model
{
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function projectVersion(): BelongsTo
    {
        return $this->belongsTo(ProjectVersion::class);
    }

    public function examples(): HasMany
    {
        return $this->hasMany(LessonExample::class);
    }

    public function trainingProgram(): BelongsTo
    {
        return $this->belongsTo(TrainingProgram::class);
    }

    public function trainingModule(): BelongsTo
    {
        return $this->belongsTo(TrainingModule::class);
    }

    public function checkpoints(): HasMany
    {
        return $this->hasMany(VideoCheckpoint::class)->orderBy('sort_order');
    }

    public function quiz(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(LessonQuiz::class);
    }

    protected function casts(): array
    {
        return [
            'status' => LessonStatus::class,
            'learning_objectives' => 'array',
            'completion_criteria' => 'array',
        ];
    }
}
