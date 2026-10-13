<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class XpEvent extends Model
{
    protected $fillable = ['user_id', 'event_type', 'source_type', 'source_id', 'points'];
}
