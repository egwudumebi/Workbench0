<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskTypeResource;
use App\Models\Project;
use App\Models\TaskType;
use App\Services\Admin\AuditLogService;
use App\Support\TaskTypeSchema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminTaskTypeController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Project $project): JsonResponse
    {
        $taskTypes = $project->taskTypes()->orderBy('name')->get();

        return response()->json([
            'data' => TaskTypeResource::collection($taskTypes),
        ]);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'schema' => ['required', 'array'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);
        $schema = TaskTypeSchema::withDisplay($validated['schema'], $slug);

        $taskType = TaskType::query()->create([
            'project_id' => $project->id,
            'name' => $validated['name'],
            'slug' => $slug,
            'schema' => $schema,
        ]);

        $this->auditLogService->log($request->user(), 'task_type_created', $taskType, null, $taskType->toArray());

        return response()->json(['data' => new TaskTypeResource($taskType)], 201);
    }

    public function update(Request $request, Project $project, TaskType $taskType): JsonResponse
    {
        abort_unless($taskType->project_id === $project->id, 404);

        $before = $taskType->toArray();
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'schema' => ['sometimes', 'array'],
        ]);

        if (isset($validated['schema'])) {
            $validated['schema'] = TaskTypeSchema::withDisplay($validated['schema'], $taskType->slug);
        }

        $taskType->update($validated);
        $this->auditLogService->log($request->user(), 'task_type_updated', $taskType, $before, $taskType->fresh()->toArray());

        return response()->json(['data' => new TaskTypeResource($taskType->fresh())]);
    }
}
