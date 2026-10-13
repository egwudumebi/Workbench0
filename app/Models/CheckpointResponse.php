<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CheckpointResponse extends Model
{
    protected $fillable = ['user_id', 'video_checkpoint_id', 'answer', 'is_correct'];
}
