<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    protected $fillable = ['user_id', 'lesson_quiz_id', 'answers', 'score_percent', 'passed'];

    protected function casts(): array
    {
        return ['answers' => 'array', 'passed' => 'boolean'];
    }
}
