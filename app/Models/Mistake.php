<?php

namespace App\Models;

use App\Enums\MistakeSeverity;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'project_id',
    'category',
    'severity',
    'description',
    'occurrence_count',
    'first_seen_at',
    'last_seen_at',
    'resolved_at',
    'current_rate',
])]
class Mistake extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    protected function casts(): array
    {
        return [
            'severity' => MistakeSeverity::class,
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'resolved_at' => 'datetime',
            'current_rate' => 'decimal:2',
        ];
    }
}
