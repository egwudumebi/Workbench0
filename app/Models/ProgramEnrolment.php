<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramEnrolment extends Model
{
    protected $fillable = ['user_id', 'training_program_id', 'status', 'progress_percent', 'enrolled_at', 'last_activity_at'];

    protected function casts(): array
    {
        return ['enrolled_at' => 'datetime', 'last_activity_at' => 'datetime', 'progress_percent' => 'float'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(TrainingProgram::class, 'training_program_id');
    }
}
