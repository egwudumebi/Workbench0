<?php

namespace App\Enums;

enum DifficultyLevel: int
{
    case Beginner = 1;
    case Intermediate = 2;
    case Advanced = 3;
    case Expert = 4;
    case Production = 5;

    public function label(): string
    {
        return match ($this) {
            self::Beginner => 'Beginner',
            self::Intermediate => 'Intermediate',
            self::Advanced => 'Advanced',
            self::Expert => 'Expert',
            self::Production => 'Production',
        };
    }
}
