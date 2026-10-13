<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoCheckpoint extends Model
{
    protected $fillable = ['lesson_id', 'timestamp_seconds', 'question', 'options', 'correct_answer', 'explanation', 'sort_order'];

    protected function casts(): array
    {
        return ['options' => 'array'];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
