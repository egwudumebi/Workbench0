<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PracticeAttempt extends Model
{
    protected $fillable = ['user_id', 'practice_challenge_id', 'submission', 'score_percent', 'feedback', 'passed'];

    protected function casts(): array
    {
        return [
            'submission' => 'array',
            'feedback' => 'array',
            'passed' => 'boolean',
        ];
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(PracticeChallenge::class, 'practice_challenge_id');
    }
}
