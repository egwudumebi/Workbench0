<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskTypeResource;
use App\Models\Project;
use App\Services\Admin\AuditLogService;
use App\Services\Admin\ProjectSetupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminProjectController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService,
        private readonly ProjectSetupService $projectSetupService,
    ) {}

    public function index(): JsonResponse
    {
        $projects = Project::query()
            ->withCount(['tasks', 'taskTypes', 'skills', 'trainingPrograms'])
            ->orderBy('name')
            ->paginate(config('workbench.pagination.admin', 25));

        return response()->json([
            'data' => ProjectResource::collection($projects),
            'meta' => [
                'current_page' => $projects->currentPage(),
                'last_page' => $projects->lastPage(),
                'total' => $projects->total(),
            ],
        ]);
    }

    public function show(Project $project): JsonResponse
    {
        $project->load(['currentVersion', 'taskTypes', 'skills', 'tasks']);

        return response()->json([
            'data' => array_merge(
                (new ProjectResource($project))->resolve(),
                [
                    'task_types' => TaskTypeResource::collection($project->taskTypes)->resolve(),
                    'skills_count' => $project->skills->count(),
                    'tasks_count' => $project->tasks->count(),
                    'current_version' => $project->currentVersion,
                ]
            ),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'instructions' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,active,archived'],
            'template_slug' => ['nullable', 'string', 'max:255'],
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $suffix = 1;
        while (Project::query()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$suffix;
            $suffix++;
        }

        $project = Project::query()->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
            'status' => $validated['status'] ?? 'draft',
        ]);

        $this->projectSetupService->bootstrap(
            $project,
            $validated['template_slug'] ?? null,
        );

        $this->auditLogService->log($request->user(), 'project_created', $project, null, $project->toArray());

        return response()->json([
            'data' => new ProjectResource($project->fresh(['currentVersion', 'taskTypes'])),
        ], 201);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $before = $project->toArray();
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'instructions' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:draft,active,archived'],
        ]);

        $project->update($validated);
        $this->auditLogService->log($request->user(), 'project_updated', $project, $before, $project->fresh()->toArray());

        return response()->json(['data' => new ProjectResource($project->fresh())]);
    }
}
