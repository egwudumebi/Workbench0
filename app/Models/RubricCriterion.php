<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['rubric_version_id', 'name', 'description', 'weight', 'critical', 'evaluation_rules', 'sort_order'])]
class RubricCriterion extends Model
{
    public function rubricVersion(): BelongsTo
    {
        return $this->belongsTo(RubricVersion::class);
    }

    protected function casts(): array
    {
        return [
            'critical' => 'boolean',
            'evaluation_rules' => 'array',
        ];
    }
}
