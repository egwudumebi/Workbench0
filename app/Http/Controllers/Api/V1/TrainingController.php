<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Training\SubmitTaskRequest;
use App\Http\Resources\EvaluationResource;
use App\Http\Resources\LearnerTaskResource;
use App\Http\Resources\SubmissionResource;
use App\Models\Project;
use App\Models\TaskVersion;
use App\Models\TrainingSession;
use App\Services\Training\TaskAccessGuard;
use App\Services\Training\TrainingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingController extends Controller
{
    public function __construct(
        private readonly TrainingService $trainingService,
        private readonly TaskAccessGuard $taskAccessGuard,
    ) {}

    public function startSession(Request $request): JsonResponse
    {
        $request->validate(['project_id' => ['required', 'integer', 'exists:projects,id']]);
        $project = Project::query()->findOrFail($request->integer('project_id'));
        $session = $this->trainingService->startSession($request->user(), $project);

        return response()->json(['data' => $session], 201);
    }

    public function nextTask(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => ['required', 'integer', 'exists:projects,id'],
        ]);

        $project = Project::query()->findOrFail($request->integer('project_id'));
        $task = $this->trainingService->nextTask($request->user(), $project);

        if (! $task) {
            return response()->json([
                'data' => null,
                'meta' => ['message' => 'No tasks available.'],
            ]);
        }

        $task->load('task.taskType');

        return response()->json([
            'data' => new LearnerTaskResource($task),
        ]);
    }

    public function submit(SubmitTaskRequest $request, TaskVersion $taskVersion): JsonResponse
    {
        $this->authorize('submit', $taskVersion);
        $this->taskAccessGuard->assertCanPractice(
            $request->user(),
            $taskVersion,
            $request->integer('training_session_id') ?: null,
        );

        $result = $this->trainingService->submitPractice(
            $request->user(),
            $taskVersion,
            $request->answer(),
            $request->integer('training_session_id') ?: null,
        );

        return response()->json([
            'data' => [
                'submission' => new SubmissionResource($result['submission']->load('evaluation.criterionScores')),
                'evaluation' => new EvaluationResource($result['evaluation']->load('criterionScores')),
                'next_task' => $result['next_task']
                    ? new LearnerTaskResource($result['next_task']->load('task.taskType'))
                    : null,
            ],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $submissions = $request->user()
            ->submissions()
            ->with(['evaluation', 'taskVersion'])
            ->latest('submitted_at')
            ->paginate(config('workbench.pagination.default', 15));

        return response()->json([
            'data' => SubmissionResource::collection($submissions),
            'meta' => [
                'current_page' => $submissions->currentPage(),
                'last_page' => $submissions->lastPage(),
                'total' => $submissions->total(),
            ],
        ]);
    }
}
