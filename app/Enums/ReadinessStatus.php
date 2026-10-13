<?php

namespace App\Enums;

enum ReadinessStatus: string
{
    case NotReady = 'not_ready';
    case Developing = 'developing';
    case NearlyReady = 'nearly_ready';
    case Ready = 'ready';

    public function label(): string
    {
        return match ($this) {
            self::NotReady => 'Not Ready',
            self::Developing => 'Developing',
            self::NearlyReady => 'Nearly Ready',
            self::Ready => 'Ready',
        };
    }
}
