<?php

namespace App\Services\Learning;

use App\DTOs\Evaluation\EvaluationResult;
use App\DTOs\Evaluation\MistakeResult;
use App\Models\Mistake;
use App\Models\User;
use Illuminate\Support\Carbon;

class MistakeTrackingService
{
    public function recordFromEvaluation(User $user, int $projectId, EvaluationResult $result): void
    {
        foreach ($result->mistakes as $mistake) {
            $this->record($user, $projectId, $mistake);
        }
    }

    public function record(User $user, int $projectId, MistakeResult $mistake): void
    {
        $existing = Mistake::query()
            ->where('user_id', $user->id)
            ->where('project_id', $projectId)
            ->where('category', $mistake->category)
            ->whereNull('resolved_at')
            ->first();

        $now = Carbon::now();

        if ($existing) {
            $occurrences = $existing->occurrence_count + 1;
            $existing->update([
                'severity' => $this->escalatedSeverity($existing->severity, $mistake->severity)->value,
                'description' => $mistake->description,
                'occurrence_count' => $occurrences,
                'last_seen_at' => $now,
                'current_rate' => $this->calculateRate($existing, false),
            ]);

            return;
        }

        Mistake::query()->create([
            'user_id' => $user->id,
            'project_id' => $projectId,
            'category' => $mistake->category,
            'severity' => $mistake->severity->value,
            'description' => $mistake->description,
            'occurrence_count' => 1,
            'first_seen_at' => $now,
            'last_seen_at' => $now,
            'current_rate' => 100,
        ]);
    }

    private function escalatedSeverity(\App\Enums\MistakeSeverity $current, \App\Enums\MistakeSeverity $incoming): \App\Enums\MistakeSeverity
    {
        $order = [
            \App\Enums\MistakeSeverity::Minor->value => 1,
            \App\Enums\MistakeSeverity::Major->value => 2,
            \App\Enums\MistakeSeverity::Critical->value => 3,
        ];

        return $order[$incoming->value] >= $order[$current->value] ? $incoming : $current;
    }

    private function calculateRate(Mistake $mistake, bool $success): float
    {
        $occurrences = max(1, $mistake->occurrence_count);
        $base = min(100, $occurrences * 15);

        return $success ? max(0, 100 - $base) : min(100, $base);
    }
}
