<?php

namespace App\Services\Academy;

use App\Enums\PracticeChallengeMode;
use App\Models\PracticeChallenge;

class PracticeChallengeScoringService
{
    /**
     * @param  array<string, mixed>  $submission
     * @return array{score_percent: int, passed: bool, feedback: array<string, mixed>}
     */
    public function score(PracticeChallenge $challenge, array $submission): array
    {
        $key = $challenge->answer_key;
        $mode = $challenge->mode;

        return match ($mode) {
            PracticeChallengeMode::ResponseDuel => $this->scoreResponseDuel($key, $submission),
            PracticeChallengeMode::SpotTheError => $this->scoreSpotError($key, $submission),
            PracticeChallengeMode::RuleMatch => $this->scoreRuleMatch($key, $submission),
            PracticeChallengeMode::Scenario => $this->scoreScenario($key, $submission),
            PracticeChallengeMode::Boss => $this->scoreBoss($key, $submission),
            PracticeChallengeMode::Daily => $this->scoreResponseDuel($key, $submission),
        };
    }

    /**
     * @param  array<string, mixed>  $key
     * @param  array<string, mixed>  $submission
     * @return array{score_percent: int, passed: bool, feedback: array<string, mixed>}
     */
    private function scoreResponseDuel(array $key, array $submission): array
    {
        $decision = $submission['decision'] ?? null;
        $explanation = trim((string) ($submission['explanation'] ?? ''));
        $correct = ($key['decision'] ?? null) === $decision;
        $explOk = mb_strlen($explanation) >= (int) ($key['min_explanation_length'] ?? 20);
        $score = ($correct ? 70 : 0) + ($explOk ? 30 : 0);

        return [
            'score_percent' => $score,
            'passed' => $score >= 70,
            'feedback' => [
                'summary' => $correct ? 'Strong comparative judgment.' : 'Decision does not match the rubric-aligned choice.',
                'decision_correct' => $correct,
                'explanation_adequate' => $explOk,
                'rationale' => $key['rationale'] ?? null,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $key
     * @param  array<string, mixed>  $submission
     */
    private function scoreSpotError(array $key, array $submission): array
    {
        $selected = $submission['error_id'] ?? null;
        $correct = ($key['error_id'] ?? null) === $selected;
        $score = $correct ? 100 : 0;

        return [
            'score_percent' => $score,
            'passed' => $correct,
            'feedback' => [
                'summary' => $correct ? 'You identified the primary issue.' : 'Review the response for factual or instruction-following errors.',
                'explanation' => $key['explanation'] ?? null,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $key
     * @param  array<string, mixed>  $submission
     */
    private function scoreRuleMatch(array $key, array $submission): array
    {
        $pairs = $submission['pairs'] ?? [];
        $expected = $key['pairs'] ?? [];
        $total = max(1, count($expected));
        $correctCount = 0;

        foreach ($expected as $exampleId => $ruleId) {
            if (($pairs[$exampleId] ?? null) === $ruleId) {
                $correctCount++;
            }
        }

        $score = (int) round(($correctCount / $total) * 100);

        return [
            'score_percent' => $score,
            'passed' => $score >= 80,
            'feedback' => [
                'summary' => "{$correctCount}/{$total} matches correct.",
                'correct_count' => $correctCount,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $key
     * @param  array<string, mixed>  $submission
     */
    private function scoreScenario(array $key, array $submission): array
    {
        $choice = $submission['choice'] ?? null;
        $acceptable = $key['acceptable_choices'] ?? [$key['best_choice'] ?? null];
        $correct = in_array($choice, $acceptable, true);
        $score = $correct ? 100 : 40;

        return [
            'score_percent' => $score,
            'passed' => $correct,
            'feedback' => [
                'summary' => $key['feedback'][$choice] ?? ($correct ? 'Reasonable decision.' : 'Consider the rubric and escalation rules.'),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $key
     * @param  array<string, mixed>  $submission
     */
    private function scoreBoss(array $key, array $submission): array
    {
        $stages = $key['stages'] ?? [];
        $answers = $submission['stages'] ?? [];
        $total = max(1, count($stages));
        $passedStages = 0;

        foreach ($stages as $index => $stage) {
            if (($answers[$index]['answer'] ?? null) === ($stage['answer'] ?? null)) {
                $passedStages++;
            }
        }

        $score = (int) round(($passedStages / $total) * 100);

        return [
            'score_percent' => $score,
            'passed' => $score >= 75,
            'feedback' => [
                'summary' => "Boss challenge: {$passedStages}/{$total} stages passed.",
                'stages_passed' => $passedStages,
            ],
        ];
    }
}
