<?php

namespace App\Services\Learning;

use App\DTOs\Evaluation\EvaluationResult;
use App\Models\Skill;
use App\Models\TaskVersion;
use App\Models\User;
use App\Models\UserSkillProgress;

class SkillProgressService
{
    public function updateFromEvaluation(User $user, TaskVersion $taskVersion, EvaluationResult $result): void
    {
        $task = $taskVersion->task()->with('skills')->firstOrFail();
        $recentWeight = config('workbench.training.recent_attempts_weight', 0.6);
        $difficultyMultiplier = match ($taskVersion->difficulty->value) {
            1 => 0.8,
            2 => 1.0,
            3 => 1.2,
            4 => 1.4,
            default => 1.6,
        };

        $adjustedScore = min(100, $result->score * $difficultyMultiplier);

        foreach ($task->skills as $skill) {
            $progress = UserSkillProgress::query()->firstOrCreate(
                ['user_id' => $user->id, 'skill_id' => $skill->id],
                ['mastery_score' => 0, 'attempt_count' => 0, 'correct_count' => 0, 'trend' => 'stable']
            );

            $attemptCount = $progress->attempt_count + 1;
            $correctCount = $progress->correct_count + ($result->passed ? 1 : 0);
            $previousMastery = (float) $progress->mastery_score;
            $newMastery = ($previousMastery * (1 - $recentWeight)) + ($adjustedScore * $recentWeight);

            $trend = match (true) {
                $newMastery > $previousMastery + 2 => 'improving',
                $newMastery < $previousMastery - 2 => 'declining',
                default => 'stable',
            };

            $progress->update([
                'mastery_score' => round($newMastery, 2),
                'attempt_count' => $attemptCount,
                'correct_count' => $correctCount,
                'recent_score' => $adjustedScore,
                'trend' => $trend,
            ]);
        }
    }

    /**
     * @return array<int, array{skill: Skill, progress: UserSkillProgress}>
     */
    public function forUserAndProject(User $user, int $projectId): array
    {
        return Skill::query()
            ->where('project_id', $projectId)
            ->where('active', true)
            ->with(['userProgress' => fn ($q) => $q->where('user_id', $user->id)])
            ->orderBy('name')
            ->get()
            ->map(function (Skill $skill) use ($user) {
                $progress = UserSkillProgress::query()->firstOrCreate(
                    ['user_id' => $user->id, 'skill_id' => $skill->id],
                    ['mastery_score' => 0, 'attempt_count' => 0, 'correct_count' => 0, 'trend' => 'stable']
                );

                return ['skill' => $skill, 'progress' => $progress];
            })
            ->all();
    }
}
