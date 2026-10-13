<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'skill_id',
    'mastery_score',
    'attempt_count',
    'correct_count',
    'recent_score',
    'trend',
])]
class UserSkillProgress extends Model
{
    protected $table = 'user_skill_progress';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }

    protected function casts(): array
    {
        return [
            'mastery_score' => 'decimal:2',
            'recent_score' => 'decimal:2',
        ];
    }
}
