<?php

namespace App\Models;

use App\Enums\AcademyStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Academy extends Model
{
    protected $fillable = [
        'user_id', 'title', 'description', 'target_platform', 'experience_level',
        'learning_goals', 'status', 'published_curriculum_version_id', 'authorized_upload',
    ];

    protected function casts(): array
    {
        return [
            'status' => AcademyStatus::class,
            'learning_goals' => 'array',
            'authorized_upload' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(GuidelineDocument::class)->latest();
    }

    public function generations(): HasMany
    {
        return $this->hasMany(AcademyGeneration::class);
    }

    public function curriculumVersions(): HasMany
    {
        return $this->hasMany(CurriculumVersion::class);
    }

    public function publishedCurriculum(): BelongsTo
    {
        return $this->belongsTo(CurriculumVersion::class, 'published_curriculum_version_id');
    }
}
