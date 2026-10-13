<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\LessonStatus;
use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\TrainingModule;
use App\Services\Admin\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminLessonController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function show(Lesson $lesson): JsonResponse
    {
        $lesson->load(['checkpoints', 'quiz.questions']);

        return response()->json(['data' => $lesson]);
    }

    public function store(Request $request, TrainingModule $trainingModule): JsonResponse
    {
        $program = $trainingModule->program()->with('project')->firstOrFail();
        $project = $program->project;
        abort_unless($project, 422, 'Programme must be linked to a training project before adding lessons.');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:120', Rule::unique('lessons', 'slug')],
            'summary' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'estimated_minutes' => ['nullable', 'integer', 'min:1', 'max:480'],
            'video_url' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', Rule::enum(LessonStatus::class)],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $sortOrder = $validated['sort_order']
            ?? ((int) $trainingModule->lessons()->max('sort_order')) + 1;

        $lesson = Lesson::query()->create([
            'project_id' => $project->id,
            'project_version_id' => $project->current_version_id,
            'training_program_id' => $program->id,
            'training_module_id' => $trainingModule->id,
            'title' => $validated['title'],
            'slug' => $validated['slug'] ?? Str::slug($validated['title']).'-'.Str::random(4),
            'summary' => $validated['summary'] ?? null,
            'content' => $validated['content'] ?? '',
            'sort_order' => $sortOrder,
            'status' => $validated['status'] ?? LessonStatus::Draft,
            'estimated_minutes' => $validated['estimated_minutes'] ?? 10,
            'video_url' => $validated['video_url'] ?? null,
            'learning_objectives' => [],
        ]);

        $this->auditLogService->log($request->user(), 'lesson_created', $lesson, null, $lesson->toArray());

        return response()->json(['data' => $lesson], 201);
    }

    public function update(Request $request, Lesson $lesson): JsonResponse
    {
        $before = $lesson->toArray();
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'summary' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'estimated_minutes' => ['nullable', 'integer', 'min:1', 'max:480'],
            'video_url' => ['nullable', 'string', 'max:500'],
            'caption_url' => ['nullable', 'string', 'max:500'],
            'transcript' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::enum(LessonStatus::class)],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $lesson->update($validated);
        $this->auditLogService->log($request->user(), 'lesson_updated', $lesson, $before, $lesson->fresh()->toArray());

        return response()->json(['data' => $lesson->fresh()]);
    }

    public function destroy(Request $request, Lesson $lesson): JsonResponse
    {
        $before = $lesson->toArray();
        $lesson->delete();
        $this->auditLogService->log($request->user(), 'lesson_deleted', $lesson, $before, null);

        return response()->json(['data' => ['deleted' => true]]);
    }
}
