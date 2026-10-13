<?php

namespace App\Services\Training;

use App\Models\Mistake;
use App\Models\Project;
use App\Models\Submission;
use App\Models\TaskVersion;
use App\Models\User;
use App\Models\UserSkillProgress;
use Illuminate\Support\Collection;

class AdaptiveTrainingService
{
    public function selectNextTask(User $user, Project $project, ?int $excludeTaskVersionId = null): ?TaskVersion
    {
        $project->loadMissing('currentVersion');
        $projectVersionId = $project->current_version_id;

        if (! $projectVersionId) {
            return null;
        }

        $attemptedTaskVersionIds = Submission::query()
            ->where('user_id', $user->id)
            ->where('project_version_id', $projectVersionId)
            ->where('mode', 'practice')
            ->pluck('task_version_id');

        $weakSkillIds = UserSkillProgress::query()
            ->where('user_id', $user->id)
            ->whereHas('skill', fn ($q) => $q->where('project_id', $project->id))
            ->where('mastery_score', '<', config('workbench.training.weak_skill_threshold', 70))
            ->pluck('skill_id');

        $recurringCategories = Mistake::query()
            ->where('user_id', $user->id)
            ->where('project_id', $project->id)
            ->whereNull('resolved_at')
            ->where('occurrence_count', '>=', config('workbench.training.mistake_recurrence_threshold', 3))
            ->pluck('category');

        $query = TaskVersion::query()
            ->where('project_version_id', $projectVersionId)
            ->where('active', true)
            ->whereHas('task', fn ($q) => $q->where('project_id', $project->id)->where('active', true))
            ->with(['task.skills']);

        if ($excludeTaskVersionId) {
            $query->where('id', '!=', $excludeTaskVersionId);
        }

        /** @var Collection<int, TaskVersion> $candidates */
        $candidates = $query->get();

        if ($candidates->isEmpty()) {
            return null;
        }

        $scored = $candidates->map(function (TaskVersion $taskVersion) use ($weakSkillIds, $recurringCategories, $attemptedTaskVersionIds) {
            $score = 0;
            $taskSkillIds = $taskVersion->task->skills->pluck('id');

            foreach ($weakSkillIds as $skillId) {
                if ($taskSkillIds->contains($skillId)) {
                    $score += 50;
                }
            }

            foreach ($recurringCategories as $category) {
                if ($this->taskTargetsCategory($taskVersion, $category)) {
                    $score += 40;
                }
            }

            if (! $attemptedTaskVersionIds->contains($taskVersion->id)) {
                $score += 20;
            }

            $score += $taskVersion->difficulty->value * 5;

            return ['task' => $taskVersion, 'score' => $score];
        })->sortByDesc('score')->values();

        return $scored->first()['task'] ?? $candidates->random();
    }

    private function taskTargetsCategory(TaskVersion $taskVersion, string $category): bool
    {
        $expected = $taskVersion->expected_output ?? [];
        $categories = $expected['target_categories'] ?? [];

        return in_array($category, $categories, true);
    }
}
