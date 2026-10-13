<?php

namespace App\Services\Assessment;

use App\Enums\AssessmentStatus;
use App\Enums\SubmissionMode;
use App\Models\Assessment;
use App\Models\AssessmentSubmission;
use App\Models\AssessmentTask;
use App\Models\Evaluation;
use App\Models\Project;
use App\Models\RubricVersion;
use App\Models\Submission;
use App\Models\TaskVersion;
use App\Models\User;
use App\Services\Evaluation\EvaluationEngineInterface;
use App\Services\Learning\MistakeTrackingService;
use App\Services\Learning\SkillProgressService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AssessmentService
{
    public function __construct(
        private readonly EvaluationEngineInterface $evaluationEngine,
        private readonly SkillProgressService $skillProgressService,
        private readonly MistakeTrackingService $mistakeTrackingService,
    ) {}

    public function create(User $user, Project $project): Assessment
    {
        $project->loadMissing('currentVersion');
        $taskCount = config('workbench.assessment.default_task_count', 20);
        $timeLimit = config('workbench.assessment.default_time_limit_minutes', 45);

        return DB::transaction(function () use ($user, $project, $taskCount, $timeLimit) {
            $existing = Assessment::query()
                ->where('user_id', $user->id)
                ->where('project_id', $project->id)
                ->where('status', AssessmentStatus::InProgress)
                ->first();

            if ($existing) {
                return $existing->load([
                    'assessmentTasks.taskVersion.task.taskType',
                    'assessmentSubmissions',
                ]);
            }

            $assessment = Assessment::query()->create([
                'user_id' => $user->id,
                'project_id' => $project->id,
                'project_version_id' => $project->current_version_id,
                'status' => AssessmentStatus::InProgress,
                'task_count' => $taskCount,
                'time_limit_minutes' => $timeLimit,
                'started_at' => Carbon::now(),
            ]);

            $tasks = TaskVersion::query()
                ->where('project_version_id', $project->current_version_id)
                ->where('active', true)
                ->whereHas('task', fn ($q) => $q->where('active', true))
                ->inRandomOrder()
                ->limit($taskCount)
                ->get();

            foreach ($tasks as $index => $taskVersion) {
                AssessmentTask::query()->create([
                    'assessment_id' => $assessment->id,
                    'task_version_id' => $taskVersion->id,
                    'sort_order' => $index + 1,
                ]);

                AssessmentSubmission::query()->create([
                    'assessment_id' => $assessment->id,
                    'task_version_id' => $taskVersion->id,
                    'sort_order' => $index + 1,
                ]);
            }

            Log::info('assessment.started', ['assessment_id' => $assessment->id, 'user_id' => $user->id]);

            return $assessment->load([
                'assessmentTasks.taskVersion.task.taskType',
                'assessmentSubmissions',
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $answer
     */
    public function submitTask(User $user, Assessment $assessment, TaskVersion $taskVersion, array $answer): Submission
    {
        if ($assessment->user_id !== $user->id || $assessment->status !== AssessmentStatus::InProgress) {
            abort(403, 'Assessment is not available for submission.');
        }

        $slot = AssessmentSubmission::query()
            ->where('assessment_id', $assessment->id)
            ->where('task_version_id', $taskVersion->id)
            ->firstOrFail();

        if ($slot->submission_id) {
            abort(422, 'This assessment task has already been submitted.');
        }

        $project = $assessment->project()->with('rubrics.currentVersion')->firstOrFail();
        $rubricVersion = $project->rubrics->first()?->currentVersion
            ?? RubricVersion::query()->where('project_version_id', $assessment->project_version_id)->firstOrFail();

        return DB::transaction(function () use ($user, $assessment, $taskVersion, $answer, $slot, $rubricVersion, $project) {
            $submission = Submission::query()->create([
                'user_id' => $user->id,
                'task_version_id' => $taskVersion->id,
                'project_version_id' => $assessment->project_version_id,
                'rubric_version_id' => $rubricVersion->id,
                'assessment_id' => $assessment->id,
                'mode' => SubmissionMode::Assessment,
                'answer' => $answer,
                'submitted_at' => Carbon::now(),
            ]);

            $slot->update(['submission_id' => $submission->id]);

            return $submission;
        });
    }

    public function finalize(User $user, Assessment $assessment): Assessment
    {
        if ($assessment->user_id !== $user->id) {
            abort(403);
        }

        return DB::transaction(function () use ($user, $assessment) {
            $assessment->load(['assessmentSubmissions.submission', 'assessmentTasks.taskVersion']);
            $project = $assessment->project()->with('rubrics.currentVersion')->firstOrFail();
            $rubricVersion = $project->rubrics->first()?->currentVersion
                ?? RubricVersion::query()->where('project_version_id', $assessment->project_version_id)->firstOrFail();

            $scores = [];

            foreach ($assessment->assessmentSubmissions as $slot) {
                if (! $slot->submission) {
                    continue;
                }

                $taskVersion = $slot->taskVersion;
                $result = app(EvaluationEngineInterface::class)->evaluate(
                    $taskVersion,
                    $slot->submission,
                    $rubricVersion,
                );

                Evaluation::query()->create([
                    'submission_id' => $slot->submission->id,
                    'project_version_id' => $assessment->project_version_id,
                    'task_version_id' => $taskVersion->id,
                    'rubric_version_id' => $rubricVersion->id,
                    'evaluation_engine' => config('workbench.evaluation.driver', 'local'),
                    'evaluation_engine_version' => config('workbench.evaluation.engine_version', '1.0.0'),
                    'evaluation_rules_version' => config('workbench.evaluation.rules_version', '1.0.0'),
                    'score' => $result->score,
                    'passed' => $result->passed,
                    'decision_correct' => $result->decisionCorrect,
                    'result_payload' => $result->toArray(),
                ]);

                $this->skillProgressService->updateFromEvaluation($user, $taskVersion, $result);
                $this->mistakeTrackingService->recordFromEvaluation($user, $assessment->project_id, $result);

                $scores[] = $result->score;
            }

            $average = count($scores) ? array_sum($scores) / count($scores) : 0;
            $passed = $average >= config('workbench.readiness.assessment_pass_threshold', 80);

            $assessment->update([
                'status' => AssessmentStatus::Completed,
                'completed_at' => Carbon::now(),
                'score' => round($average, 2),
                'passed' => $passed,
            ]);

            Log::info('assessment.completed', [
                'assessment_id' => $assessment->id,
                'score' => $average,
                'passed' => $passed,
            ]);

            return $assessment->fresh();
        });
    }
}
