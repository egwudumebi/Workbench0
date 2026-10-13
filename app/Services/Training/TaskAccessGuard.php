<?php

namespace App\Services\Training;

use App\Models\Assessment;
use App\Models\TaskVersion;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

class TaskAccessGuard
{
    public function assertCanPractice(User $user, TaskVersion $taskVersion, ?int $trainingSessionId = null): void
    {
        $taskVersion->loadMissing('task.project');

        if (! $taskVersion->active || ! $taskVersion->task?->active) {
            throw new AuthorizationException('This task is not available for practice.');
        }

        if ($taskVersion->task?->project?->status->value !== 'active') {
            throw new AuthorizationException('This project is not active.');
        }

        if ($trainingSessionId) {
            $session = TrainingSession::query()->find($trainingSessionId);

            if (! $session || $session->user_id !== $user->id) {
                throw new AuthorizationException('Invalid training session.');
            }

            if ($session->project_version_id !== $taskVersion->project_version_id) {
                throw new AuthorizationException('Task does not belong to this training session.');
            }
        }
    }

    public function assertCanAssess(User $user, Assessment $assessment, TaskVersion $taskVersion): void
    {
        if ($assessment->user_id !== $user->id) {
            throw new AuthorizationException('You cannot access this assessment.');
        }

        if ($assessment->status->value !== 'in_progress') {
            throw new AuthorizationException('This assessment is no longer active.');
        }

        $belongs = $assessment->assessmentTasks()
            ->where('task_version_id', $taskVersion->id)
            ->exists();

        if (! $belongs) {
            throw new AuthorizationException('This task is not part of the assessment.');
        }
    }
}
