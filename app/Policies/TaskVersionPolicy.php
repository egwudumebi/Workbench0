<?php

namespace App\Policies;

use App\Models\TaskVersion;
use App\Models\User;

class TaskVersionPolicy
{
    public function submit(User $user, TaskVersion $taskVersion): bool
    {
        if (! $taskVersion->active) {
            return false;
        }

        $taskVersion->loadMissing('task.project');

        return $taskVersion->task?->active
            && $taskVersion->task?->project?->status->value === 'active';
    }
}
