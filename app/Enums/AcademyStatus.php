<?php

namespace App\Enums;

enum AcademyStatus: string
{
    case Draft = 'draft';
    case Generating = 'generating';
    case Review = 'review';
    case Published = 'published';
    case Archived = 'archived';
}
