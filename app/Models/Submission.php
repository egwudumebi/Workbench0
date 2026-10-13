<?php

namespace App\Models;

use App\Enums\SubmissionMode;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use LogicException;

#[Fillable([
    'user_id',
    'task_version_id',
    'project_version_id',
    'rubric_version_id',
    'training_session_id',
    'assessment_id',
    'mode',
    'answer',
    'submitted_at',
])]
class Submission extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function taskVersion(): BelongsTo
    {
        return $this->belongsTo(TaskVersion::class);
    }

    public function evaluation(): HasOne
    {
        return $this->hasOne(Evaluation::class);
    }

    protected static function booted(): void
    {
        static::updating(function (Submission $submission): void {
            if ($submission->isDirty('answer')) {
                throw new LogicException('Submission answer cannot be modified after creation.');
            }
        });
    }

    protected function casts(): array
    {
        return [
            'mode' => SubmissionMode::class,
            'answer' => 'array',
            'submitted_at' => 'datetime',
        ];
    }
}
