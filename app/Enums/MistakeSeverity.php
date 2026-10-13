<?php

namespace App\Enums;

enum MistakeSeverity: string
{
    case Minor = 'minor';
    case Major = 'major';
    case Critical = 'critical';
}
