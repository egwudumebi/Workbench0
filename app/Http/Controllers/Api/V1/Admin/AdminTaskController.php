<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminTaskResource;
use App\Models\Task;
use App\Models\TaskVersion;
use App\Services\Admin\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminTaskController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Task::query()->with(['taskType', 'currentVersion', 'project']);

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        $tasks = $query->orderBy('title')->paginate(config('workbench.pagination.admin', 25));

        return response()->json([
            'data' => AdminTaskResource::collection($tasks->load('currentVersion')),
            'meta' => [
                'current_page' => $tasks->currentPage(),
                'last_page' => $tasks->lastPage(),
                'total' => $tasks->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => ['required', 'exists:projects,id'],
            'task_type_id' => ['required', 'exists:task_types,id'],
            'project_version_id' => ['required', 'exists:project_versions,id'],
            'title' => ['required', 'string', 'max:255'],
            'prompt' => ['required', 'string'],
            'context' => ['nullable', 'array'],
            'response_a' => ['nullable', 'string'],
            'response_b' => ['nullable', 'string'],
            'configuration' => ['nullable', 'array'],
            'expected_output' => ['required', 'array'],
            'difficulty' => ['required', 'integer', 'between:1,5'],
        ]);

        $task = DB::transaction(function () use ($validated, $request) {
            $task = Task::query()->create([
                'project_id' => $validated['project_id'],
                'task_type_id' => $validated['task_type_id'],
                'slug' => Str::slug($validated['title']).'-'.Str::random(4),
                'title' => $validated['title'],
                'active' => true,
            ]);

            $version = TaskVersion::query()->create([
                'task_id' => $task->id,
                'project_version_id' => $validated['project_version_id'],
                'version_number' => 1,
                'title' => $validated['title'],
                'prompt' => $validated['prompt'],
                'context' => $validated['context'] ?? null,
                'response_a' => $validated['response_a'] ?? null,
                'response_b' => $validated['response_b'] ?? null,
                'configuration' => $validated['configuration'] ?? null,
                'expected_output' => $validated['expected_output'],
                'difficulty' => $validated['difficulty'],
                'active' => true,
            ]);

            $task->update(['current_version_id' => $version->id]);
            $this->auditLogService->log($request->user(), 'task_created', $task, null, $task->toArray());

            return $task->load(['currentVersion', 'taskType', 'project']);
        });

        return response()->json(['data' => new AdminTaskResource($task)], 201);
    }
}
