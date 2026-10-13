<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademyGeneration extends Model
{
    protected $fillable = ['academy_id', 'guideline_document_id', 'status', 'provider', 'error_message', 'completed_at'];

    protected function casts(): array
    {
        return ['completed_at' => 'datetime'];
    }

    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }
}
