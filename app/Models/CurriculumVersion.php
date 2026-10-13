<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CurriculumVersion extends Model
{
    protected $fillable = ['academy_id', 'version_number', 'structure', 'ambiguities', 'published_at'];

    protected function casts(): array
    {
        return [
            'structure' => 'array',
            'ambiguities' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }
}
