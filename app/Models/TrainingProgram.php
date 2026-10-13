<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrainingProgram extends Model
{
    protected $fillable = [
        'project_id', 'slug', 'name', 'description', 'audience', 'learning_objectives',
        'source_classification', 'last_reviewed_at', 'estimated_hours', 'difficulty',
        'prerequisites', 'learning_outcomes', 'skills_covered', 'status', 'featured', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'learning_objectives' => 'array',
            'prerequisites' => 'array',
            'learning_outcomes' => 'array',
            'skills_covered' => 'array',
            'last_reviewed_at' => 'date',
            'featured' => 'boolean',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(TrainingModule::class)->orderBy('sort_order');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('sort_order');
    }

    public function enrolments(): HasMany
    {
        return $this->hasMany(ProgramEnrolment::class);
    }

    public function practiceChallenges(): HasMany
    {
        return $this->hasMany(PracticeChallenge::class);
    }
}
