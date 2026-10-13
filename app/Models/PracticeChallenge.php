<?php

namespace App\Models;

use App\Enums\PracticeChallengeMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PracticeChallenge extends Model
{
    protected $fillable = [
        'training_program_id', 'project_id', 'slug', 'mode', 'title', 'instructions',
        'difficulty', 'content', 'answer_key', 'skill_slugs', 'active', 'is_daily',
    ];

    protected function casts(): array
    {
        return [
            'mode' => PracticeChallengeMode::class,
            'content' => 'array',
            'answer_key' => 'array',
            'skill_slugs' => 'array',
            'active' => 'boolean',
            'is_daily' => 'boolean',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(TrainingProgram::class, 'training_program_id');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(PracticeAttempt::class);
    }
}
