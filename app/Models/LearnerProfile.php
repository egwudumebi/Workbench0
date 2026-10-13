<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LearnerProfile extends Model
{
    protected $fillable = ['user_id', 'xp', 'level', 'streak_days', 'last_streak_date', 'preferences'];

    protected function casts(): array
    {
        return [
            'last_streak_date' => 'date',
            'preferences' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
