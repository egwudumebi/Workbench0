<?php

namespace App\Services\Academy;

use App\Models\Achievement;
use App\Models\LearnerProfile;
use App\Models\LessonProgress;
use App\Models\PracticeAttempt;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\XpEvent;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GamificationService
{
    public function profile(User $user): LearnerProfile
    {
        return LearnerProfile::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['xp' => 0, 'level' => 1, 'streak_days' => 0]
        );
    }

    public function awardXp(User $user, string $eventType, string $sourceType, int $sourceId, ?int $points = null): ?XpEvent
    {
        $points ??= (int) config("workbench.academy.xp.{$eventType}", 10);

        return DB::transaction(function () use ($user, $eventType, $sourceType, $sourceId, $points) {
            $existing = XpEvent::query()
                ->where('user_id', $user->id)
                ->where('event_type', $eventType)
                ->where('source_type', $sourceType)
                ->where('source_id', $sourceId)
                ->first();

            if ($existing) {
                return null;
            }

            $event = XpEvent::query()->create([
                'user_id' => $user->id,
                'event_type' => $eventType,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'points' => $points,
            ]);

            $profile = $this->profile($user);
            $profile->increment('xp', $points);
            $profile->update(['level' => $this->levelForXp($profile->xp)]);

            $this->evaluateAchievements($user);

            return $event;
        });
    }

    public function recordLearningActivity(User $user): void
    {
        $profile = $this->profile($user);
        $today = now()->toDateString();
        $last = $profile->last_streak_date?->toDateString();

        if ($last === $today) {
            return;
        }

        if ($last === now()->subDay()->toDateString()) {
            $profile->increment('streak_days');
        } else {
            $profile->streak_days = 1;
        }

        $profile->last_streak_date = $today;
        $profile->save();
    }

    /**
     * @return array<int, array{achievement: Achievement, earned_at: ?\Illuminate\Support\Carbon}>
     */
    public function achievementsFor(User $user): array
    {
        $earned = UserAchievement::query()
            ->where('user_id', $user->id)
            ->pluck('earned_at', 'achievement_id');

        return Achievement::query()->orderBy('name')->get()->map(fn (Achievement $a) => [
            'achievement' => $a,
            'earned_at' => $earned[$a->id] ?? null,
        ])->all();
    }

    public function levelForXp(int $xp): int
    {
        $levels = config('workbench.academy.levels', []);
        $current = 1;

        foreach ($levels as $level => $threshold) {
            if ($xp >= $threshold) {
                $current = (int) $level;
            }
        }

        return $current;
    }

    public function xpToNextLevel(int $xp): int
    {
        $levels = config('workbench.academy.levels', []);
        $currentLevel = $this->levelForXp($xp);
        $nextLevel = $currentLevel + 1;

        if (! isset($levels[$nextLevel])) {
            return 0;
        }

        return max(0, $levels[$nextLevel] - $xp);
    }

    public function levelXpFloor(int $level): int
    {
        $levels = config('workbench.academy.levels', []);

        return (int) ($levels[$level] ?? 0);
    }

    public function levelXpCeiling(int $level): int
    {
        $levels = config('workbench.academy.levels', []);
        $next = $level + 1;

        if (! isset($levels[$next])) {
            return $this->levelXpFloor($level);
        }

        return (int) $levels[$next];
    }

    /**
     * @return array{
     *     program_id: ?int,
     *     activity_by_date: array<string, array{types: array<int, string>, events: int, xp: int}>,
     *     streak_dates: array<int, string>,
     *     insights: array{active_this_week: int, active_this_month: int, today_active: bool, weekly_goal: int, message: string}
     * }
     */
    public function learningCalendar(User $user, ?int $trainingProgramId = null): array
    {
        $profile = $this->profile($user);
        $since = now()->subMonths(4)->startOfDay();

        $lessonQuery = LessonProgress::query()
            ->where('user_id', $user->id)
            ->where('updated_at', '>=', $since);

        if ($trainingProgramId) {
            $lessonQuery->whereHas('lesson', fn ($q) => $q->where('training_program_id', $trainingProgramId));
        }

        $practiceQuery = PracticeAttempt::query()
            ->where('user_id', $user->id)
            ->where('created_at', '>=', $since);

        if ($trainingProgramId) {
            $practiceQuery->whereHas('challenge', fn ($q) => $q->where('training_program_id', $trainingProgramId));
        }

        $byDate = [];

        foreach ($lessonQuery->get() as $progress) {
            $this->bumpCalendarActivity($byDate, $progress->updated_at->toDateString(), 'lesson');
            if ($progress->completed_at) {
                $completed = $progress->completed_at->toDateString();
                if ($completed !== $progress->updated_at->toDateString()) {
                    $this->bumpCalendarActivity($byDate, $completed, 'lesson');
                }
            }
        }

        foreach ($practiceQuery->get() as $attempt) {
            $this->bumpCalendarActivity($byDate, $attempt->created_at->toDateString(), 'practice');
        }

        foreach (XpEvent::query()->where('user_id', $user->id)->where('created_at', '>=', $since)->get() as $event) {
            $date = $event->created_at->toDateString();
            if (! isset($byDate[$date])) {
                $byDate[$date] = ['types' => [], 'events' => 0, 'xp' => 0];
            }
            $byDate[$date]['xp'] += $event->points;
        }

        $streakDates = [];
        if ($profile->last_streak_date && $profile->streak_days > 0) {
            for ($i = 0; $i < $profile->streak_days; $i++) {
                $streakDates[] = $profile->last_streak_date->copy()->subDays($i)->toDateString();
            }
        }

        $weekStart = now()->startOfWeek(Carbon::MONDAY);
        $monthStart = now()->startOfMonth();
        $today = now()->toDateString();

        $activeThisWeek = collect($byDate)->filter(
            fn ($_, $date) => Carbon::parse($date)->greaterThanOrEqualTo($weekStart)
        )->count();

        $activeThisMonth = collect($byDate)->filter(
            fn ($_, $date) => Carbon::parse($date)->greaterThanOrEqualTo($monthStart)
        )->count();

        $weeklyGoal = 5;
        $message = match (true) {
            isset($byDate[$today]) => 'You logged learning activity today—keep the streak going.',
            $profile->streak_days >= 2 => 'One lesson or practice session today protects your streak.',
            $activeThisWeek === 0 => 'Pick two days this week for short evaluation practice.',
            default => 'Tap a highlighted day to review what you accomplished.',
        };

        return [
            'program_id' => $trainingProgramId,
            'activity_by_date' => $byDate,
            'streak_dates' => $streakDates,
            'insights' => [
                'active_this_week' => $activeThisWeek,
                'active_this_month' => $activeThisMonth,
                'today_active' => isset($byDate[$today]),
                'weekly_goal' => $weeklyGoal,
                'message' => $message,
            ],
        ];
    }

    public function progressForCriteria(User $user, string $criteriaType): int
    {
        $profile = $this->profile($user);

        return match ($criteriaType) {
            'lessons_completed' => $user->lessonProgress()->where('status', 'completed')->count(),
            'practice_passed' => $user->practiceAttempts()->where('passed', true)->count(),
            'assessments_passed' => $user->assessments()->where('status', 'completed')->where('passed', true)->count(),
            'level_reached' => $profile->level,
            'xp_total' => $profile->xp,
            default => 0,
        };
    }

    /**
     * @param  array<string, array{types: array<int, string>, events: int, xp: int}>  $byDate
     */
    private function bumpCalendarActivity(array &$byDate, string $date, string $type): void
    {
        if (! isset($byDate[$date])) {
            $byDate[$date] = ['types' => [], 'events' => 0, 'xp' => 0];
        }

        if (! in_array($type, $byDate[$date]['types'], true)) {
            $byDate[$date]['types'][] = $type;
        }

        $byDate[$date]['events']++;
    }

    private function evaluateAchievements(User $user): void
    {
        $profile = $this->profile($user);
        $stats = [
            'xp' => $profile->xp,
            'level' => $profile->level,
            'lessons_completed' => $user->lessonProgress()->where('status', 'completed')->count(),
            'practice_passed' => $user->practiceAttempts()->where('passed', true)->count(),
            'assessments_passed' => $user->assessments()->where('status', 'completed')->where('passed', true)->count(),
        ];

        foreach (Achievement::query()->cursor() as $achievement) {
            if (UserAchievement::query()->where('user_id', $user->id)->where('achievement_id', $achievement->id)->exists()) {
                continue;
            }

            $earned = match ($achievement->criteria_type) {
                'lessons_completed' => $stats['lessons_completed'] >= $achievement->criteria_value,
                'practice_passed' => $stats['practice_passed'] >= $achievement->criteria_value,
                'assessments_passed' => $stats['assessments_passed'] >= $achievement->criteria_value,
                'level_reached' => $stats['level'] >= $achievement->criteria_value,
                'xp_total' => $stats['xp'] >= $achievement->criteria_value,
                default => false,
            };

            if (! $earned) {
                continue;
            }

            UserAchievement::query()->create([
                'user_id' => $user->id,
                'achievement_id' => $achievement->id,
                'earned_at' => now(),
            ]);

            $this->awardXp($user, 'achievement', 'achievement', $achievement->id, $achievement->xp_reward ?: null);
        }
    }
}
