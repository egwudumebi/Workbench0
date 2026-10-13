<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonQuiz;
use App\Models\QuizQuestion;
use App\Services\Admin\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLessonQuizController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function upsert(Request $request, Lesson $lesson): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $quiz = LessonQuiz::query()->updateOrCreate(
            ['lesson_id' => $lesson->id],
            ['title' => $validated['title']],
        );

        return response()->json(['data' => $quiz->load('questions')]);
    }

    public function storeQuestion(Request $request, LessonQuiz $lessonQuiz): JsonResponse
    {
        $validated = $this->validateQuestion($request);

        $sortOrder = $validated['sort_order']
            ?? ((int) $lessonQuiz->questions()->max('sort_order')) + 1;

        $question = QuizQuestion::query()->create([
            'lesson_quiz_id' => $lessonQuiz->id,
            'question' => $validated['question'],
            'options' => $validated['options'],
            'correct_answer' => $validated['correct_answer'],
            'explanation' => $validated['explanation'] ?? null,
            'sort_order' => $sortOrder,
        ]);

        $this->auditLogService->log($request->user(), 'quiz_question_created', $question, null, $question->toArray());

        return response()->json(['data' => $question], 201);
    }

    public function updateQuestion(Request $request, QuizQuestion $quizQuestion): JsonResponse
    {
        $before = $quizQuestion->toArray();
        $validated = $this->validateQuestion($request, partial: true);
        $quizQuestion->update($validated);
        $this->auditLogService->log($request->user(), 'quiz_question_updated', $quizQuestion, $before, $quizQuestion->fresh()->toArray());

        return response()->json(['data' => $quizQuestion->fresh()]);
    }

    public function destroyQuestion(Request $request, QuizQuestion $quizQuestion): JsonResponse
    {
        $before = $quizQuestion->toArray();
        $quizQuestion->delete();
        $this->auditLogService->log($request->user(), 'quiz_question_deleted', $quizQuestion, $before, null);

        return response()->json(['data' => ['deleted' => true]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateQuestion(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'question' => [$required, 'string', 'max:500'],
            'options' => [$required, 'array', 'min:2'],
            'options.*' => ['string', 'max:255'],
            'correct_answer' => [$required, 'string', 'max:255'],
            'explanation' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);
    }
}
