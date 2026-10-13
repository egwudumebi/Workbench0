<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizQuestion extends Model
{
    protected $fillable = ['lesson_quiz_id', 'question', 'options', 'correct_answer', 'explanation', 'sort_order'];

    protected function casts(): array
    {
        return ['options' => 'array'];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(LessonQuiz::class, 'lesson_quiz_id');
    }
}
