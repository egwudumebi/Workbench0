<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\ProgramEnrolment;
use App\Models\TrainingProgram;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingProgramController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TrainingProgram::query()
            ->where('status', 'published')
            ->withCount(['modules', 'lessons'])
            ->orderBy('sort_order');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('difficulty')) {
            $query->where('difficulty', $request->string('difficulty'));
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        return response()->json(['data' => $query->get()]);
    }

    public function show(TrainingProgram $program): JsonResponse
    {
        $program->load(['modules.lessons' => fn ($q) => $q->where('status', 'published')]);

        return response()->json(['data' => $program]);
    }

    public function enrol(Request $request, TrainingProgram $program): JsonResponse
    {
        $enrolment = ProgramEnrolment::query()->firstOrCreate(
            [
                'user_id' => $request->user()->id,
                'training_program_id' => $program->id,
            ],
            [
                'status' => 'active',
                'progress_percent' => 0,
                'enrolled_at' => now(),
                'last_activity_at' => now(),
            ]
        );

        return response()->json(['data' => $enrolment], 201);
    }

    public function progress(Request $request, TrainingProgram $program): JsonResponse
    {
        $lessonIds = Lesson::query()->where('training_program_id', $program->id)->pluck('id');
        $progress = LessonProgress::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('lesson_id', $lessonIds)
            ->get()
            ->keyBy('lesson_id');

        return response()->json([
            'data' => $lessonIds->mapWithKeys(fn ($id) => [
                $id => $progress[$id]->status ?? 'not_started',
            ]),
        ]);
    }

    public function lesson(Request $request, Lesson $lesson): JsonResponse
    {
        abort_unless($lesson->training_program_id, 404);

        $lesson->load(['checkpoints', 'quiz.questions', 'examples']);

        $progress = $request->user()->lessonProgress()->where('lesson_id', $lesson->id)->first();

        return response()->json([
            'data' => [
                'lesson' => $lesson,
                'progress' => $progress,
            ],
        ]);
    }
}
