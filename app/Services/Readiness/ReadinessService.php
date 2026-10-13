<?php

namespace App\Services\Readiness;

use App\Enums\AssessmentStatus;
use App\Enums\MistakeSeverity;
use App\Enums\ReadinessStatus;
use App\Models\Assessment;
use App\Models\Mistake;
use App\Models\Project;
use App\Models\User;
use App\Models\UserSkillProgress;

class ReadinessService
{
    /**
     * @return array{
     *     status: ReadinessStatus,
     *     overall_score: float,
     *     skills: array<int, array<string, mixed>>,
     *     weaknesses: array<int, string>,
     *     recommendations: array<int, string>,
     *     assessments_completed: int
     * }
     */
    public function calculate(User $user, Project $project): array
    {
        $skills = UserSkillProgress::query()
            ->where('user_id', $user->id)
            ->whereHas('skill', fn ($q) => $q->where('project_id', $project->id)->where('active', true))
            ->with('skill')
            ->get();

        $overall = $skills->avg('mastery_score') ?? 0;
        $criticalThreshold = config('workbench.readiness.critical_skill_threshold', 75);
        $lowestSkill = $skills->min('mastery_score') ?? 0;

        $completedAssessments = Assessment::query()
            ->where('user_id', $user->id)
            ->where('project_id', $project->id)
            ->where('status', AssessmentStatus::Completed)
            ->orderByDesc('completed_at')
            ->get();

        $assessmentCount = $completedAssessments->count();
        $assessmentScores = $completedAssessments->pluck('score')->filter()->values();
        $assessmentConsistent = $this->assessmentsAreConsistent($assessmentScores->all());

        $criticalMistake = Mistake::query()
            ->where('user_id', $user->id)
            ->where('project_id', $project->id)
            ->whereNull('resolved_at')
            ->where('severity', MistakeSeverity::Critical->value)
            ->where('occurrence_count', '>=', 2)
            ->exists();

        $status = $this->resolveStatus(
            $overall,
            $lowestSkill,
            $assessmentCount,
            $assessmentConsistent,
            $criticalMistake,
            $criticalThreshold,
        );

        $weaknesses = Mistake::query()
            ->where('user_id', $user->id)
            ->where('project_id', $project->id)
            ->whereNull('resolved_at')
            ->orderByDesc('occurrence_count')
            ->limit(5)
            ->pluck('category')
            ->unique()
            ->values()
            ->all();

        $recommendations = [];
        if ($status !== ReadinessStatus::Ready) {
            $recommendations[] = sprintf(
                'Complete %d targeted practice tasks focusing on %s.',
                max(5, 15 - $assessmentCount * 3),
                $weaknesses[0] ?? 'weak skills'
            );
        }

        return [
            'status' => $status,
            'overall_score' => round($overall, 2),
            'skills' => $skills->map(fn (UserSkillProgress $p) => [
                'name' => $p->skill->name,
                'slug' => $p->skill->slug,
                'mastery_score' => (float) $p->mastery_score,
                'trend' => $p->trend,
            ])->values()->all(),
            'weaknesses' => $weaknesses,
            'recommendations' => $recommendations,
            'assessments_completed' => $assessmentCount,
        ];
    }

    private function resolveStatus(
        float $overall,
        float $lowestSkill,
        int $assessmentCount,
        bool $assessmentConsistent,
        bool $criticalMistake,
        int $criticalThreshold,
    ): ReadinessStatus {
        $overallThreshold = config('workbench.readiness.overall_threshold', 85);
        $minAssessments = config('workbench.readiness.minimum_assessments', 2);

        if (
            $overall >= $overallThreshold
            && $lowestSkill >= $criticalThreshold
            && $assessmentCount >= $minAssessments
            && $assessmentConsistent
            && ! $criticalMistake
        ) {
            return ReadinessStatus::Ready;
        }

        if ($overall >= $overallThreshold - 10 && $assessmentCount >= 1) {
            return ReadinessStatus::NearlyReady;
        }

        if ($overall >= 50 || $assessmentCount >= 1) {
            return ReadinessStatus::Developing;
        }

        return ReadinessStatus::NotReady;
    }

    /**
     * @param  array<int, float>  $scores
     */
    private function assessmentsAreConsistent(array $scores): bool
    {
        if (count($scores) < config('workbench.readiness.consistency_window', 2)) {
            return false;
        }

        $passThreshold = config('workbench.readiness.assessment_pass_threshold', 80);

        return collect($scores)->every(fn (float $score) => $score >= $passThreshold);
    }
}
