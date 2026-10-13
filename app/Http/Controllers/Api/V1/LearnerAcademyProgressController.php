<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CheckpointResponse;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonQuiz;
use App\Models\ProgramEnrolment;
use App\Models\QuizAttempt;
use App\Models\TrainingProgram;
use App\Models\VideoCheckpoint;
use App\Services\Academy\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LearnerAcademyProgressController extends Controller
{
    public function __construct(private readonly GamificationService $gamificationService) {}

    public function academyDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $this->gamificationService->profile($user);

        $enrolments = ProgramEnrolment::query()
            ->where('user_id', $user->id)
            ->with('program')
            ->latest('last_activity_at')
            ->get();

        $allAchievements = collect($this->gamificationService->achievementsFor($user));
        $achievements = $allAchievements->filter(fn ($row) => $row['earned_at'])->take(5)->values();

        $continueLesson = LessonProgress::query()
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->with('lesson')
            ->latest('updated_at')
            ->first();

        $daily = \App\Models\PracticeChallenge::query()
            ->where('is_daily', true)
            ->where('active', true)
            ->first();

        $primaryEnrolment = $enrolments->first();
        $calendarProgramId = $primaryEnrolment?->training_program_id;
        $programInsight = $primaryEnrolment
            ? $this->programInsight($user->id, $primaryEnrolment->training_program_id)
            : null;

        $learningCalendar = $calendarProgramId
            ? $this->gamificationService->learningCalendar($user, $calendarProgramId)
            : null;
        if ($learningCalendar && $primaryEnrolment?->program) {
            $learningCalendar['program_name'] = $primaryEnrolment->program->name;
        }

        $achievementsEarned = $allAchievements->filter(fn ($row) => $row['earned_at'])->count();
        $achievementsTotal = $allAchievements->count();

        $overallProgress = $enrolments->avg('progress_percent') ?? 0;

        return response()->json([
            'data' => [
                'profile' => [
                    'xp' => $profile->xp,
                    'level' => $profile->level,
                    'level_xp_floor' => $this->gamificationService->levelXpFloor($profile->level),
                    'level_xp_ceiling' => $this->gamificationService->levelXpCeiling($profile->level),
                    'xp_to_next_level' => $this->gamificationService->xpToNextLevel($profile->xp),
                    'streak_days' => $profile->streak_days,
                    'preferences' => $profile->preferences ?? [],
                ],
                'overall_progress_percent' => round((float) $overallProgress, 1),
                'achievements_summary' => [
                    'earned' => $achievementsEarned,
                    'total' => $achievementsTotal,
                ],
                'enrolments' => $enrolments,
                'recent_achievements' => $achievements->map(fn ($row) => [
                    'slug' => $row['achievement']->slug,
                    'name' => $row['achievement']->name,
                    'description' => $row['achievement']->description,
                    'earned_at' => $row['earned_at'],
                ]),
                'achievements' => $allAchievements->map(fn ($row) => [
                    'slug' => $row['achievement']->slug,
                    'name' => $row['achievement']->name,
                    'description' => $row['achievement']->description,
                    'earned_at' => $row['earned_at'],
                    'criteria_type' => $row['achievement']->criteria_type,
                    'criteria_value' => $row['achievement']->criteria_value,
                    'progress_value' => $this->gamificationService->progressForCriteria(
                        $user,
                        $row['achievement']->criteria_type
                    ),
                    'xp_reward' => $row['achievement']->xp_reward,
                ]),
                'continue_lesson' => $continueLesson,
                'recommended_lesson' => $programInsight['recommended_lesson'] ?? null,
                'continue_program' => $programInsight['program'] ?? null,
                'daily_challenge' => $daily ? [
                    'id' => $daily->id,
                    'title' => $daily->title,
                    'slug' => $daily->slug,
                    'mode' => $daily->mode->value,
                ] : null,
                'learning_calendar' => $learningCalendar,
            ],
        ]);
    }

    public function updateLessonProgress(Request $request, Lesson $lesson): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:not_started,in_progress,completed'],
            'video_position_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        $progress = LessonProgress::query()->updateOrCreate(
            ['user_id' => $request->user()->id, 'lesson_id' => $lesson->id],
            array_filter([
                'status' => $validated['status'] ?? 'in_progress',
                'video_position_seconds' => $validated['video_position_seconds'] ?? 0,
                'completed_at' => ($validated['status'] ?? null) === 'completed' ? now() : null,
            ])
        );

        if ($progress->status === 'completed') {
            $this->gamificationService->recordLearningActivity($request->user());
            $this->gamificationService->awardXp($request->user(), 'lesson_complete', 'lesson', $lesson->id);

            if ($lesson->training_program_id) {
                $this->refreshProgramProgress($request->user()->id, $lesson->training_program_id);
            }
        }

        return response()->json(['data' => $progress]);
    }

    public function submitCheckpoint(Request $request, VideoCheckpoint $checkpoint): JsonResponse
    {
        $validated = $request->validate(['answer' => ['required', 'string', 'max:500']]);

        $isCorrect = $validated['answer'] === $checkpoint->correct_answer;

        $response = CheckpointResponse::query()->updateOrCreate(
            ['user_id' => $request->user()->id, 'video_checkpoint_id' => $checkpoint->id],
            ['answer' => $validated['answer'], 'is_correct' => $isCorrect]
        );

        if ($isCorrect) {
            $this->gamificationService->awardXp(
                $request->user(),
                'checkpoint_correct',
                'video_checkpoint',
                $checkpoint->id
            );
        }

        return response()->json([
            'data' => [
                'response' => $response,
                'is_correct' => $isCorrect,
                'explanation' => $checkpoint->explanation,
            ],
        ]);
    }

    public function submitQuiz(Request $request, LessonQuiz $quiz): JsonResponse
    {
        $validated = $request->validate(['answers' => ['required', 'array']]);

        $questions = $quiz->questions;
        $total = max(1, $questions->count());
        $correct = 0;

        foreach ($questions as $question) {
            if (($validated['answers'][$question->id] ?? null) === $question->correct_answer) {
                $correct++;
            }
        }

        $score = (int) round(($correct / $total) * 100);
        $passed = $score >= 70;

        $attempt = DB::transaction(function () use ($request, $quiz, $validated, $score, $passed) {
            return QuizAttempt::query()->updateOrCreate(
                ['user_id' => $request->user()->id, 'lesson_quiz_id' => $quiz->id],
                ['answers' => $validated['answers'], 'score_percent' => $score, 'passed' => $passed]
            );
        });

        if ($passed) {
            $this->gamificationService->awardXp($request->user(), 'quiz_pass', 'lesson_quiz', $quiz->id);
        }

        return response()->json([
            'data' => [
                'attempt' => $attempt,
                'score_percent' => $score,
                'passed' => $passed,
                'explanations' => $questions->mapWithKeys(fn ($q) => [$q->id => $q->explanation]),
            ],
        ]);
    }

    /**
     * @return array{program: array<string, mixed>|null, recommended_lesson: array<string, mixed>|null}
     */
    private function programInsight(int $userId, int $programId): array
    {
        $program = TrainingProgram::query()->with(['modules.lessons' => fn ($q) => $q->where('status', 'published')])->find($programId);
        if (! $program) {
            return ['program' => null, 'recommended_lesson' => null];
        }

        $lessons = $program->modules->flatMap->lessons->values();
        $progress = LessonProgress::query()
            ->where('user_id', $userId)
            ->whereIn('lesson_id', $lessons->pluck('id'))
            ->pluck('status', 'lesson_id');

        $recommended = null;
        foreach ($lessons as $lesson) {
            if (($progress[$lesson->id] ?? 'not_started') !== 'completed') {
                $recommended = $lesson;
                break;
            }
        }

        $estimatedMinutes = (int) $lessons->sum('estimated_minutes');

        return [
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'description' => $program->description,
                'progress_percent' => (float) (ProgramEnrolment::query()
                    ->where('user_id', $userId)
                    ->where('training_program_id', $programId)
                    ->value('progress_percent') ?? 0),
                'modules_count' => $program->modules->count(),
                'lessons_count' => $lessons->count(),
                'estimated_hours' => max(1, (int) round($estimatedMinutes / 60)),
            ],
            'recommended_lesson' => $recommended ? [
                'id' => $recommended->id,
                'title' => $recommended->title,
                'summary' => $recommended->summary,
            ] : null,
        ];
    }

    private function refreshProgramProgress(int $userId, int $programId): void
    {
        $total = Lesson::query()->where('training_program_id', $programId)->where('status', 'published')->count();
        if ($total === 0) {
            return;
        }

        $completed = LessonProgress::query()
            ->where('user_id', $userId)
            ->where('status', 'completed')
            ->whereIn('lesson_id', Lesson::query()->where('training_program_id', $programId)->pluck('id'))
            ->count();

        ProgramEnrolment::query()
            ->where('user_id', $userId)
            ->where('training_program_id', $programId)
            ->update([
                'progress_percent' => round(($completed / $total) * 100, 2),
                'last_activity_at' => now(),
            ]);
    }
}
