<?php

namespace App\Services\Evaluation;

use App\DTOs\Evaluation\CriterionScoreResult;
use App\DTOs\Evaluation\EvaluationResult;
use App\DTOs\Evaluation\FeedbackResult;
use App\DTOs\Evaluation\MistakeResult;
use App\Enums\MistakeSeverity;
use App\Models\RubricCriterion;
use App\Models\RubricVersion;
use App\Models\Submission;
use App\Models\TaskVersion;
use Illuminate\Support\Str;

class LocalEvaluationEngine implements EvaluationEngineInterface
{
    public function evaluate(
        TaskVersion $taskVersion,
        Submission $submission,
        RubricVersion $rubricVersion,
    ): EvaluationResult {
        $answer = $submission->answer;
        $expected = $taskVersion->expected_output ?? [];
        $configuration = $taskVersion->configuration ?? [];

        $decision = strtolower(trim((string) ($answer['decision'] ?? '')));
        $explanation = trim((string) ($answer['explanation'] ?? ''));
        $expectedDecision = strtolower(trim((string) ($expected['decision'] ?? '')));
        $acceptableDecisions = array_map(
            'strtolower',
            $expected['acceptable_decisions'] ?? [$expectedDecision]
        );

        $requiresExplanation = (bool) ($configuration['requires_explanation'] ?? true);
        $minExplanationLength = (int) ($configuration['minimum_explanation_length'] ?? 20);

        $decisionCorrect = in_array($decision, $acceptableDecisions, true);
        $criterionScores = [];
        $mistakes = [];

        foreach ($rubricVersion->criteria as $criterion) {
            [$score, $passed, $reason] = $this->scoreCriterion(
                $criterion,
                $decision,
                $decisionCorrect,
                $explanation,
                $expected,
                $requiresExplanation,
                $minExplanationLength,
            );

            $criterionScores[] = new CriterionScoreResult(
                criterion: $criterion->name,
                score: $score,
                weight: $criterion->weight,
                passed: $passed,
                reason: $reason,
                rubricCriterionId: $criterion->id,
            );

            if (! $passed) {
                $mistakes = array_merge(
                    $mistakes,
                    $this->mistakesForCriterion($criterion, $reason)
                );
            }
        }

        if ($decision === '') {
            $mistakes[] = new MistakeResult(
                category: 'decision',
                severity: MistakeSeverity::Critical,
                description: 'No evaluation decision was provided.',
            );
        } elseif (! $decisionCorrect) {
            $mistakes[] = new MistakeResult(
                category: 'decision',
                severity: MistakeSeverity::Critical,
                description: sprintf(
                    'Expected decision "%s" but received "%s".',
                    $expectedDecision,
                    $decision ?: 'none'
                ),
            );
        }

        if ($requiresExplanation && strlen($explanation) < $minExplanationLength) {
            $mistakes[] = new MistakeResult(
                category: 'explanation',
                severity: MistakeSeverity::Major,
                description: sprintf(
                    'Explanation must be at least %d characters.',
                    $minExplanationLength
                ),
            );
        }

        $explanationScore = $this->scoreExplanationContent($explanation, $expected);
        if ($requiresExplanation && $decisionCorrect && $explanationScore < 70) {
            $mistakes[] = new MistakeResult(
                category: 'explanation',
                severity: MistakeSeverity::Major,
                description: 'Decision was correct but reasoning did not meet evaluation standards.',
            );
        }

        $overallScore = $this->weightedScore($criterionScores);
        $criticalFailed = collect($criterionScores)->contains(
            fn (CriterionScoreResult $c) => ! $c->passed && $this->isCritical($rubricVersion, $c->criterion)
        );

        $passed = $overallScore >= 70 && $decisionCorrect && ! $criticalFailed;
        $resultLabel = $this->resultLabel($decisionCorrect, $overallScore);

        $feedback = $this->buildFeedback(
            $decisionCorrect,
            $overallScore,
            $explanation,
            $expected,
            $mistakes,
            $requiresExplanation,
            $explanationScore,
        );

        return new EvaluationResult(
            score: round($overallScore, 2),
            passed: $passed,
            decisionCorrect: $decisionCorrect,
            resultLabel: $resultLabel,
            criterionScores: $criterionScores,
            mistakes: $this->uniqueMistakes($mistakes),
            feedback: $feedback,
        );
    }

    /**
     * @return array{0: float, 1: bool, 2: string|null}
     */
    private function scoreCriterion(
        RubricCriterion $criterion,
        string $decision,
        bool $decisionCorrect,
        string $explanation,
        array $expected,
        bool $requiresExplanation,
        int $minExplanationLength,
    ): array {
        $rules = $criterion->evaluation_rules ?? [];
        $slug = Str::slug($criterion->name);

        return match (true) {
            str_contains($slug, 'decision') || str_contains($slug, 'accuracy') && ! str_contains($slug, 'explanation') => [
                $decisionCorrect ? 100.0 : 0.0,
                $decisionCorrect,
                $decisionCorrect ? 'Decision matches the expected evaluation.' : 'Decision does not match the expected evaluation.',
            ],
            str_contains($slug, 'instruction') => $this->scoreInstructionFollowing($decision, $decisionCorrect, $rules),
            str_contains($slug, 'relevance') => $this->scoreKeywordCriterion($explanation, $expected['relevance_keywords'] ?? [], $decisionCorrect),
            str_contains($slug, 'reasoning') => [
                (float) $this->scoreExplanationContent($explanation, $expected),
                $this->scoreExplanationContent($explanation, $expected) >= 70,
                'Reasoning quality assessed against required concepts.',
            ],
            str_contains($slug, 'evidence') => $this->scoreKeywordCriterion($explanation, $expected['evidence_keywords'] ?? [], $decisionCorrect),
            str_contains($slug, 'completeness') => [
                $requiresExplanation && strlen($explanation) >= $minExplanationLength ? 100.0 : 50.0,
                ! $requiresExplanation || strlen($explanation) >= $minExplanationLength,
                'Completeness based on explanation length and required elements.',
            ],
            str_contains($slug, 'explanation') => [
                (float) $this->scoreExplanationContent($explanation, $expected),
                $this->scoreExplanationContent($explanation, $expected) >= 70,
                'Explanation quality assessed against rubric rules.',
            ],
            str_contains($slug, 'consistency') => [
                $decisionCorrect && $this->scoreExplanationContent($explanation, $expected) >= 60 ? 100.0 : 40.0,
                $decisionCorrect && $this->scoreExplanationContent($explanation, $expected) >= 60,
                'Consistency between decision and explanation.',
            ],
            default => [
                $decisionCorrect ? 85.0 : 30.0,
                $decisionCorrect,
                'General criterion evaluation.',
            ],
        };
    }

    /**
     * @return array{0: float, 1: bool, 2: string|null}
     */
    private function scoreInstructionFollowing(string $decision, bool $decisionCorrect, array $rules): array
    {
        $requiredOption = strtolower((string) ($rules['required_option'] ?? ''));

        if ($requiredOption !== '' && $decision !== $requiredOption) {
            return [0.0, false, 'Response did not follow required rating option.'];
        }

        return [
            $decisionCorrect ? 100.0 : 50.0,
            $decisionCorrect || $requiredOption === '',
            $decisionCorrect ? 'Instructions followed.' : 'Instruction following needs improvement.',
        ];
    }

    /**
     * @param  array<int, string>  $keywords
     * @return array{0: float, 1: bool, 2: string|null}
     */
    private function scoreKeywordCriterion(string $explanation, array $keywords, bool $decisionCorrect): array
    {
        if ($keywords === []) {
            return [
                $decisionCorrect ? 90.0 : 40.0,
                $decisionCorrect,
                'No specific keywords required for this criterion.',
            ];
        }

        $haystack = strtolower($explanation);
        $found = collect($keywords)->filter(fn (string $kw) => str_contains($haystack, strtolower($kw)))->count();
        $ratio = $found / max(count($keywords), 1);
        $score = round($ratio * 100, 2);

        return [
            $score,
            $score >= 70,
            $found > 0 ? 'Identified relevant evaluation concepts.' : 'Did not identify key evaluation concepts.',
        ];
    }

    private function scoreExplanationContent(string $explanation, array $expected): float
    {
        if ($explanation === '') {
            return 0.0;
        }

        $score = 40.0;
        $haystack = strtolower($explanation);

        $requiredConcepts = $expected['required_concepts'] ?? [];
        if ($requiredConcepts !== []) {
            $found = collect($requiredConcepts)->filter(
                fn (string $concept) => str_contains($haystack, strtolower($concept))
            )->count();
            $score += ($found / count($requiredConcepts)) * 40;
        } else {
            $score += 20;
        }

        $prohibitedConcepts = $expected['prohibited_concepts'] ?? [];
        foreach ($prohibitedConcepts as $prohibited) {
            if (str_contains($haystack, strtolower($prohibited))) {
                $score -= 25;
            }
        }

        if (($expected['explanation_rules']['must_identify_error'] ?? false) && ! $this->mentionsError($haystack)) {
            $score -= 15;
        }

        return max(0.0, min(100.0, round($score, 2)));
    }

    private function mentionsError(string $haystack): bool
    {
        foreach (['incorrect', 'wrong', 'error', 'inaccurate', 'false', 'misleading', 'invalid'] as $term) {
            if (str_contains($haystack, $term)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<int, CriterionScoreResult>  $criterionScores
     */
    private function weightedScore(array $criterionScores): float
    {
        $totalWeight = 0;
        $weighted = 0;

        foreach ($criterionScores as $criterion) {
            $totalWeight += $criterion->weight;
            $weighted += $criterion->score * $criterion->weight;
        }

        if ($totalWeight === 0) {
            return 0.0;
        }

        return round($weighted / $totalWeight, 2);
    }

    private function isCritical(RubricVersion $rubricVersion, string $criterionName): bool
    {
        return $rubricVersion->criteria
            ->firstWhere('name', $criterionName)?->critical ?? false;
    }

    private function resultLabel(bool $decisionCorrect, float $score): string
    {
        if (! $decisionCorrect) {
            return 'Incorrect';
        }

        if ($score >= 85) {
            return 'Correct';
        }

        return 'Partially Correct';
    }

    /**
     * @param  array<int, MistakeResult>  $mistakes
     */
    private function buildFeedback(
        bool $decisionCorrect,
        float $score,
        string $explanation,
        array $expected,
        array $mistakes,
        bool $requiresExplanation,
        float $explanationScore,
    ): FeedbackResult {
        $whatWentWell = $decisionCorrect
            ? 'You selected the correct evaluation decision.'
            : 'You attempted a structured evaluation with an explanation.';

        if ($requiresExplanation && $explanationScore >= 70) {
            $whatWentWell .= ' Your reasoning addressed key evaluation concepts.';
        }

        $whatWasMissed = $mistakes !== []
            ? collect($mistakes)->pluck('description')->unique()->implode(' ')
            : 'No major issues detected.';

        $whyItMatters = $decisionCorrect && $explanationScore < 70
            ? 'Correct labels with weak reasoning will fail quality review on real evaluation projects.'
            : 'Accurate, well-reasoned evaluations help ensure AI systems are assessed consistently.';

        $howToImprove = $expected['improvement_hint']
            ?? 'Identify the core claim, verify it, explain why your rating applies, and cite the specific issue.';

        $summary = match (true) {
            ! $decisionCorrect => 'Your evaluation decision needs correction.',
            $score >= 85 => 'Strong evaluation. Your decision and reasoning align with the rubric.',
            default => 'Your decision was on track, but your explanation needs strengthening.',
        };

        return new FeedbackResult(
            summary: $summary,
            whatWentWell: trim($whatWentWell),
            whatWasMissed: $whatWasMissed,
            whyItMatters: $whyItMatters,
            howToImprove: (string) $howToImprove,
        );
    }

    /**
     * @return array<int, MistakeResult>
     */
    private function mistakesForCriterion(RubricCriterion $criterion, ?string $reason): array
    {
        $slug = Str::slug($criterion->name);
        $category = match (true) {
            str_contains($slug, 'factual') => 'factual_accuracy',
            str_contains($slug, 'instruction') => 'instruction_following',
            str_contains($slug, 'relevance') => 'relevance',
            str_contains($slug, 'reasoning') => 'reasoning',
            str_contains($slug, 'evidence') => 'evidence',
            str_contains($slug, 'explanation') => 'explanation',
            str_contains($slug, 'consistency') => 'consistency',
            default => 'decision',
        };

        return [
            new MistakeResult(
                category: $category,
                severity: $criterion->critical ? MistakeSeverity::Critical : MistakeSeverity::Major,
                description: $reason ?? "Did not meet criterion: {$criterion->name}.",
            ),
        ];
    }

    /**
     * @param  array<int, MistakeResult>  $mistakes
     * @return array<int, MistakeResult>
     */
    private function uniqueMistakes(array $mistakes): array
    {
        $seen = [];

        return array_values(array_filter($mistakes, function (MistakeResult $mistake) use (&$seen) {
            $key = $mistake->category.'|'.$mistake->description;

            if (isset($seen[$key])) {
                return false;
            }

            $seen[$key] = true;

            return true;
        }));
    }
}
