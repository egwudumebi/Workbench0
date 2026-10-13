<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['assessment_id', 'task_version_id', 'submission_id', 'sort_order'])]
class AssessmentSubmission extends Model
{
    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function taskVersion(): BelongsTo
    {
        return $this->belongsTo(TaskVersion::class);
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }
}
