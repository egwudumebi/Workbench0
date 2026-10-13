<?php

namespace App\Enums;

enum PracticeChallengeMode: string
{
    case ResponseDuel = 'response_duel';
    case SpotTheError = 'spot_the_error';
    case RuleMatch = 'rule_match';
    case Scenario = 'scenario';
    case Boss = 'boss';
    case Daily = 'daily';

    public function label(): string
    {
        return match ($this) {
            self::ResponseDuel => 'Response Duel',
            self::SpotTheError => 'Spot the Error',
            self::RuleMatch => 'Rule Match',
            self::Scenario => 'Scenario Simulator',
            self::Boss => 'Boss Challenge',
            self::Daily => 'Daily Challenge',
        };
    }
}
