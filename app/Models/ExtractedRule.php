<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExtractedRule extends Model
{
    protected $fillable = [
        'guideline_document_id', 'rule_key', 'rule_text', 'section_ref', 'category',
        'importance', 'review_status', 'confidence', 'related_objectives',
    ];

    protected function casts(): array
    {
        return ['related_objectives' => 'array', 'confidence' => 'float'];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(GuidelineDocument::class, 'guideline_document_id');
    }
}
