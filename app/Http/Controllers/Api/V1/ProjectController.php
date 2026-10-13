<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProjectStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\LessonResource;
use App\Http\Resources\ProjectResource;
use App\Models\Lesson;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $projects = Project::query()
            ->where('status', ProjectStatus::Active)
            ->orderBy('name')
            ->paginate(config('workbench.pagination.default', 15));

        return response()->json([
            'data' => ProjectResource::collection($projects),
            'meta' => [
                'current_page' => $projects->currentPage(),
                'last_page' => $projects->lastPage(),
                'per_page' => $projects->perPage(),
                'total' => $projects->total(),
            ],
        ]);
    }

    public function show(Project $project): JsonResponse
    {
        abort_unless($project->status === ProjectStatus::Active, 404);

        $project->load(['taskTypes', 'currentVersion']);

        return response()->json([
            'data' => new ProjectResource($project),
        ]);
    }

    public function lessons(Project $project): JsonResponse
    {
        abort_unless($project->status === ProjectStatus::Active, 404);

        $lessons = Lesson::query()
            ->where('project_id', $project->id)
            ->where('status', 'published')
            ->with('examples')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'data' => LessonResource::collection($lessons),
        ]);
    }
}
