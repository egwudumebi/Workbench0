<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Mistake;
use App\Models\Project;
use App\Models\TrainingSession;
use App\Services\Learning\SkillProgressService;
use App\Services\Readiness\ReadinessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function __construct(
        private readonly SkillProgressService $skillProgressService,
        private readonly ReadinessService $readinessService,
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $request->validate(['project_id' => ['required', 'integer', 'exists:projects,id']]);

        $user = $request->user();
        $project = Project::query()->findOrFail($request->integer('project_id'));
        $readiness = $this->readinessService->calculate($user, $project);
        $skills = $this->skillProgressService->forUserAndProject($user, $project->id);

        $recentSessions = TrainingSession::query()
            ->where('user_id', $user->id)
            ->where('project_id', $project->id)
            ->latest('started_at')
            ->limit(5)
            ->get();

        $recentAssessments = Assessment::query()
            ->where('user_id', $user->id)
            ->where('project_id', $project->id)
            ->where('status', 'completed')
            ->latest('completed_at')
            ->limit(5)
            ->get();

        $weaknesses = Mistake::query()
            ->where('user_id', $user->id)
            ->where('project_id', $project->id)
            ->whereNull('resolved_at')
            ->orderByDesc('occurrence_count')
            ->limit(5)
            ->get(['category', 'severity', 'description', 'occurrence_count', 'current_rate']);

        return response()->json([
            'data' => [
                'readiness' => [
                    'status' => $readiness['status']->value,
                    'status_label' => $readiness['status']->label(),
                    'overall_score' => $readiness['overall_score'],
                    'assessments_completed' => $readiness['assessments_completed'],
                    'recommendations' => $readiness['recommendations'],
                ],
                'skills' => collect($skills)->map(fn ($row) => [
                    'name' => $row['skill']->name,
                    'slug' => $row['skill']->slug,
                    'mastery_score' => (float) $row['progress']->mastery_score,
                    'trend' => $row['progress']->trend,
                ]),
                'weaknesses' => $weaknesses,
                'recent_training' => $recentSessions,
                'recent_assessments' => $recentAssessments,
            ],
        ]);
    }

    public function skills(Request $request): JsonResponse
    {
        $request->validate(['project_id' => ['required', 'integer', 'exists:projects,id']]);
        $skills = $this->skillProgressService->forUserAndProject(
            $request->user(),
            $request->integer('project_id')
        );

        return response()->json([
            'data' => collect($skills)->map(fn ($row) => [
                'name' => $row['skill']->name,
                'slug' => $row['skill']->slug,
                'description' => $row['skill']->description,
                'mastery_score' => (float) $row['progress']->mastery_score,
                'attempt_count' => $row['progress']->attempt_count,
                'correct_count' => $row['progress']->correct_count,
                'recent_score' => (float) $row['progress']->recent_score,
                'trend' => $row['progress']->trend,
            ]),
        ]);
    }

    public function mistakes(Request $request): JsonResponse
    {
        $request->validate(['project_id' => ['required', 'integer', 'exists:projects,id']]);

        $mistakes = Mistake::query()
            ->where('user_id', $request->user()->id)
            ->where('project_id', $request->integer('project_id'))
            ->whereNull('resolved_at')
            ->orderByDesc('occurrence_count')
            ->paginate(config('workbench.pagination.default', 15));

        return response()->json([
            'data' => $mistakes->items(),
            'meta' => [
                'current_page' => $mistakes->currentPage(),
                'last_page' => $mistakes->lastPage(),
                'total' => $mistakes->total(),
            ],
        ]);
    }
}
