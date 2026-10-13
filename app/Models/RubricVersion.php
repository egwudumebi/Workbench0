<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['rubric_id', 'project_version_id', 'version_number', 'name', 'active'])]
class RubricVersion extends Model
{
    public function rubric(): BelongsTo
    {
        return $this->belongsTo(Rubric::class);
    }

    public function projectVersion(): BelongsTo
    {
        return $this->belongsTo(ProjectVersion::class);
    }

    public function criteria(): HasMany
    {
        return $this->hasMany(RubricCriterion::class);
    }

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }
}
