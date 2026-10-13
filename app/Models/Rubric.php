<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['project_id', 'name', 'current_version_id'])]
class Rubric extends Model
{
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(RubricVersion::class, 'current_version_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(RubricVersion::class);
    }
}
