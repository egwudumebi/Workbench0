<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LearnerTaskResource;
use App\Http\Resources\SubmissionResource;
use App\Enums\AssessmentStatus;
use App\Models\Assessment;
use App\Models\Project;
use App\Models\TaskVersion;
use App\Services\Assessment\AssessmentService;
use App\Services\Readiness\ReadinessService;
use App\Services\Training\TaskAccessGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
    public function __construct(
        private readonly AssessmentService $assessmentService,
        private readonly ReadinessService $readinessService,
        private readonly TaskAccessGuard $taskAccessGuard,
    ) {}

    public function current(Request $request): JsonResponse
    {
        $request->validate(['project_id' => ['required', 'integer', 'exists:projects,id']]);

        $assessment = Assessment::query()
            ->where('user_id', $request->user()->id)
            ->where('project_id', $request->integer('project_id'))
            ->where('status', AssessmentStatus::InProgress)
            ->first();

        if (! $assessment) {
            return response()->json(['data' => null]);
        }

        $assessment->load(['assessmentTasks.taskVersion.task.taskType', 'assessmentSubmissions']);

        return response()->json(['data' => $this->formatAssessment($assessment)]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate(['project_id' => ['required', 'integer', 'exists:projects,id']]);
        $project = Project::query()->findOrFail($request->integer('project_id'));
        $assessment = $this->assessmentService->create($request->user(), $project);
        $assessment->load(['assessmentTasks.taskVersion.task.taskType', 'assessmentSubmissions']);

        return response()->json(['data' => $this->formatAssessment($assessment)], 201);
    }

    public function show(Request $request, Assessment $assessment): JsonResponse
    {
        $this->authorize('view', $assessment);

        $assessment->load(['assessmentTasks.taskVersion.task.taskType', 'assessmentSubmissions']);

        return response()->json(['data' => $this->formatAssessment($assessment)]);
    }

    public function submitTask(Request $request, Assessment $assessment, TaskVersion $taskVersion): JsonResponse
    {
        $this->authorize('submit', $assessment);
        $this->taskAccessGuard->assertCanAssess($request->user(), $assessment, $taskVersion);

        $request->validate([
            'decision' => ['required', 'string', 'max:100'],
            'explanation' => ['nullable', 'string', 'max:5000'],
        ]);

        $submission = $this->assessmentService->submitTask($request->user(), $assessment, $taskVersion, [
            'decision' => $request->string('decision')->toString(),
            'explanation' => $request->string('explanation')->toString(),
        ]);

        return response()->json([
            'data' => [
                'submission_id' => $submission->id,
                'task_version_id' => $taskVersion->id,
            ],
        ], 201);
    }

    public function finalize(Request $request, Assessment $assessment): JsonResponse
    {
        $this->authorize('finalize', $assessment);

        $assessment = $this->assessmentService->finalize($request->user(), $assessment);
        $readiness = $this->readinessService->calculate($request->user(), $assessment->project);

        return response()->json([
            'data' => [
                'assessment' => $assessment,
                'readiness' => [
                    'status' => $readiness['status']->value,
                    'status_label' => $readiness['status']->label(),
                    'overall_score' => $readiness['overall_score'],
                ],
            ],
        ]);
    }

    public function result(Request $request, Assessment $assessment): JsonResponse
    {
        $this->authorize('view', $assessment);
        abort_unless($assessment->status->value === 'completed', 422, 'Assessment is not completed.');

        $assessment->load(['assessmentSubmissions.submission.evaluation']);

        $submissions = $assessment->assessmentSubmissions
            ->sortBy('sort_order')
            ->pluck('submission')
            ->filter()
            ->values();

        return response()->json([
            'data' => [
                'assessment' => $assessment,
                'submissions' => SubmissionResource::collection($submissions)->resolve(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatAssessment(Assessment $assessment): array
    {
        $tasks = LearnerTaskResource::collection(
            $assessment->assessmentTasks
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($at) => $at->taskVersion->load('task.taskType'))
        )->resolve();

        $submittedIds = $assessment->assessmentSubmissions
            ->whereNotNull('submission_id')
            ->pluck('task_version_id')
            ->all();

        return [
            'id' => $assessment->id,
            'status' => $assessment->status->value,
            'task_count' => $assessment->task_count,
            'time_limit_minutes' => $assessment->time_limit_minutes,
            'started_at' => $assessment->started_at?->toIso8601String(),
            'completed_at' => $assessment->completed_at?->toIso8601String(),
            'score' => $assessment->score,
            'passed' => $assessment->passed,
            'tasks' => $tasks,
            'submitted_task_version_ids' => $submittedIds,
        ];
    }
}
