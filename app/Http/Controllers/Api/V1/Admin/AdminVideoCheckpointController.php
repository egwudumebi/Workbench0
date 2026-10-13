<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\VideoCheckpoint;
use App\Services\Admin\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminVideoCheckpointController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function store(Request $request, Lesson $lesson): JsonResponse
    {
        $validated = $this->validateCheckpoint($request);

        $sortOrder = $validated['sort_order']
            ?? ((int) $lesson->checkpoints()->max('sort_order')) + 1;

        $checkpoint = VideoCheckpoint::query()->create([
            'lesson_id' => $lesson->id,
            'timestamp_seconds' => $validated['timestamp_seconds'],
            'question' => $validated['question'],
            'options' => $validated['options'],
            'correct_answer' => $validated['correct_answer'],
            'explanation' => $validated['explanation'] ?? null,
            'sort_order' => $sortOrder,
        ]);

        $this->auditLogService->log($request->user(), 'video_checkpoint_created', $checkpoint, null, $checkpoint->toArray());

        return response()->json(['data' => $checkpoint], 201);
    }

    public function update(Request $request, VideoCheckpoint $videoCheckpoint): JsonResponse
    {
        $before = $videoCheckpoint->toArray();
        $validated = $this->validateCheckpoint($request, partial: true);
        $videoCheckpoint->update($validated);
        $this->auditLogService->log($request->user(), 'video_checkpoint_updated', $videoCheckpoint, $before, $videoCheckpoint->fresh()->toArray());

        return response()->json(['data' => $videoCheckpoint->fresh()]);
    }

    public function destroy(Request $request, VideoCheckpoint $videoCheckpoint): JsonResponse
    {
        $before = $videoCheckpoint->toArray();
        $videoCheckpoint->delete();
        $this->auditLogService->log($request->user(), 'video_checkpoint_deleted', $videoCheckpoint, $before, null);

        return response()->json(['data' => ['deleted' => true]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateCheckpoint(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'timestamp_seconds' => [$required, 'integer', 'min:0', 'max:86400'],
            'question' => [$required, 'string', 'max:500'],
            'options' => [$required, 'array', 'min:2'],
            'options.*' => ['string', 'max:255'],
            'correct_answer' => [$required, 'string', 'max:255'],
            'explanation' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);
    }
}
