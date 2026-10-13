<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SourceReference extends Model
{
    protected $fillable = [
        'referable_type', 'referable_id', 'guideline_document_id', 'section_ref', 'page_ref', 'excerpt',
    ];
}
