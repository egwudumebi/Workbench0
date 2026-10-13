<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Achievement extends Model
{
    protected $fillable = ['slug', 'name', 'description', 'icon', 'criteria_type', 'criteria_value', 'xp_reward'];
}
