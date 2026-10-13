<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GuidelineDocument extends Model
{
    protected $fillable = [
        'academy_id', 'user_id', 'original_filename', 'disk_path', 'mime_type', 'size_bytes',
        'extracted_text', 'ocr_required', 'extraction_failed', 'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
            'ocr_required' => 'boolean',
            'extraction_failed' => 'boolean',
        ];
    }

    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }

    public function rules(): HasMany
    {
        return $this->hasMany(ExtractedRule::class);
    }
}
