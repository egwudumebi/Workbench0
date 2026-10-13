<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AssessmentStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\LessonProgress;
use App\Models\PracticeAttempt;
use App\Models\ProgramEnrolment;
use App\Models\Submission;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\UserAchievement;
use App\Services\Academy\GamificationService;
use App\Services\Admin\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLearnerController extends Controller
{
    public function __construct(
        private readonly GamificationService $gamificationService,
        private readonly AuditLogService $auditLogService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->where('role', 'learner')
            ->with(['learnerProfile:user_id,xp,level,preferences'])
            ->withCount(['programEnrolments as enrolments_count'])
            ->withMax('programEnrolments as last_activity_at', 'last_activity_at')
            ->orderBy('name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $learners = $query->paginate(config('workbench.pagination.admin', 25));

        $learnerIds = collect($learners->items())->pluck('id');
        $activeEnrolments = ProgramEnrolment::query()
            ->whereIn('user_id', $learnerIds)
            ->where('status', 'active')
            ->selectRaw('user_id, count(*) as active_count')
            ->groupBy('user_id')
            ->pluck('active_count', 'user_id');

        return response()->json([
            'data' => collect($learners->items())->map(function (User $user) use ($activeEnrolments) {
                $preferences = $user->learnerProfile?->preferences ?? [];
                $lastActivity = $user->last_activity_at;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'display_name' => $preferences['display_name'] ?? null,
                    'email' => $user->email,
                    'created_at' => $user->created_at?->toIso8601String(),
                    'last_activity_at' => $lastActivity ? \Illuminate\Support\Carbon::parse($lastActivity)->toIso8601String() : null,
                    'level' => (int) ($user->learnerProfile?->level ?? 1),
                    'xp' => (int) ($user->learnerProfile?->xp ?? 0),
                    'enrolments_count' => (int) $user->enrolments_count,
                    'active_enrolments' => (int) ($activeEnrolments[$user->id] ?? 0),
                ];
            }),
            'meta' => [
                'current_page' => $learners->currentPage(),
                'last_page' => $learners->lastPage(),
                'total' => $learners->total(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        abort_unless($user->role === UserRole::Learner, 404);

        $profile = $this->gamificationService->profile($user);

        $enrolments = ProgramEnrolment::query()
            ->where('user_id', $user->id)
            ->with('program:id,name,slug,status')
            ->orderByDesc('last_activity_at')
            ->get()
            ->map(fn (ProgramEnrolment $e) => [
                'id' => $e->id,
                'status' => $e->status,
                'progress_percent' => (float) $e->progress_percent,
                'enrolled_at' => $e->enrolled_at?->toIso8601String(),
                'last_activity_at' => $e->last_activity_at?->toIso8601String(),
                'program' => $e->program ? [
                    'id' => $e->program->id,
                    'name' => $e->program->name,
                    'slug' => $e->program->slug,
                    'status' => $e->program->status,
                ] : null,
            ]);

        $recentAssessments = Assessment::query()
            ->where('user_id', $user->id)
            ->with('project:id,name')
            ->latest('started_at')
            ->limit(8)
            ->get()
            ->map(fn (Assessment $a) => [
                'id' => $a->id,
                'status' => $a->status->value,
                'score' => $a->score,
                'passed' => $a->passed,
                'started_at' => $a->started_at?->toIso8601String(),
                'completed_at' => $a->completed_at?->toIso8601String(),
                'project' => $a->project?->only(['id', 'name']),
            ]);

        $recentSubmissions = Submission::query()
            ->where('user_id', $user->id)
            ->with(['taskVersion:id,title', 'evaluation:id,submission_id,score,passed'])
            ->latest('submitted_at')
            ->limit(10)
            ->get()
            ->map(fn (Submission $s) => [
                'id' => $s->id,
                'mode' => $s->mode->value,
                'submitted_at' => $s->submitted_at?->toIso8601String(),
                'task_title' => $s->taskVersion?->title,
                'evaluation' => $s->evaluation ? [
                    'score' => $s->evaluation->score,
                    'passed' => $s->evaluation->passed,
                ] : null,
            ]);

        $recentArena = PracticeAttempt::query()
            ->where('user_id', $user->id)
            ->with('challenge:id,title,mode')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (PracticeAttempt $a) => [
                'id' => $a->id,
                'passed' => $a->passed,
                'score_percent' => $a->score_percent,
                'created_at' => $a->created_at?->toIso8601String(),
                'challenge' => $a->challenge ? [
                    'title' => $a->challenge->title,
                    'mode' => $a->challenge->mode->value,
                ] : null,
            ]);

        $achievements = UserAchievement::query()
            ->where('user_id', $user->id)
            ->with('achievement:id,slug,name,xp_reward')
            ->latest('earned_at')
            ->limit(10)
            ->get()
            ->map(fn (UserAchievement $ua) => [
                'slug' => $ua->achievement?->slug,
                'name' => $ua->achievement?->name,
                'xp_reward' => $ua->achievement?->xp_reward,
                'earned_at' => $ua->earned_at?->toIso8601String(),
            ]);

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at?->toIso8601String(),
                ],
                'display_name' => $profile->preferences['display_name'] ?? null,
                'academy_profile' => [
                    'xp' => $profile->xp,
                    'level' => $profile->level,
                    'streak_days' => $profile->streak_days,
                    'level_xp_floor' => $this->gamificationService->levelXpFloor($profile->level),
                    'level_xp_ceiling' => $this->gamificationService->levelXpCeiling($profile->level),
                ],
                'stats' => [
                    'submissions' => Submission::query()->where('user_id', $user->id)->count(),
                    'assessments_completed' => Assessment::query()
                        ->where('user_id', $user->id)
                        ->where('status', AssessmentStatus::Completed)
                        ->count(),
                    'practice_attempts' => PracticeAttempt::query()->where('user_id', $user->id)->count(),
                    'lessons_completed' => LessonProgress::query()
                        ->where('user_id', $user->id)
                        ->where('status', 'completed')
                        ->count(),
                    'lessons_in_progress' => LessonProgress::query()
                        ->where('user_id', $user->id)
                        ->where('status', 'in_progress')
                        ->count(),
                ],
                'enrolments' => $enrolments,
                'recent_assessments' => $recentAssessments,
                'recent_submissions' => $recentSubmissions,
                'recent_arena_attempts' => $recentArena,
                'recent_achievements' => $achievements,
            ],
        ]);
    }

    public function enrol(Request $request, User $user): JsonResponse
    {
        abort_unless($user->role === UserRole::Learner, 404);

        $validated = $request->validate([
            'training_program_id' => ['required', 'integer', 'exists:training_programs,id'],
        ]);

        $program = TrainingProgram::query()->findOrFail($validated['training_program_id']);

        $enrolment = ProgramEnrolment::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'training_program_id' => $program->id,
            ],
            [
                'status' => 'active',
                'progress_percent' => 0,
                'enrolled_at' => now(),
                'last_activity_at' => now(),
            ],
        );

        if (! $enrolment->wasRecentlyCreated) {
            $enrolment->update([
                'status' => 'active',
                'last_activity_at' => now(),
            ]);
        }

        $this->auditLogService->log(
            $request->user(),
            'learner_enrolled',
            $enrolment,
            null,
            $enrolment->fresh()->toArray(),
        );

        return response()->json([
            'data' => [
                'id' => $enrolment->id,
                'training_program_id' => $enrolment->training_program_id,
                'program_name' => $program->name,
                'status' => $enrolment->status,
            ],
        ], $enrolment->wasRecentlyCreated ? 201 : 200);
    }

    public function unenrol(Request $request, User $user, ProgramEnrolment $enrolment): JsonResponse
    {
        abort_unless($user->role === UserRole::Learner, 404);
        abort_unless($enrolment->user_id === $user->id, 404);

        $before = $enrolment->toArray();
        $enrolment->delete();

        $this->auditLogService->log($request->user(), 'learner_unenrolled', $enrolment, $before, null);

        return response()->json(['data' => ['deleted' => true]]);
    }
}
