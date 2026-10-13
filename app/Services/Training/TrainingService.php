<?php

namespace App\Services\Training;

use App\DTOs\Evaluation\EvaluationResult;
use App\Enums\SubmissionMode;
use App\Models\Evaluation;
use App\Models\EvaluationCriterionScore;
use App\Models\Project;
use App\Models\RubricVersion;
use App\Models\Submission;
use App\Models\TaskVersion;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Evaluation\EvaluationEngineInterface;
use App\Services\Learning\MistakeTrackingService;
use App\Services\Learning\SkillProgressService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TrainingService
{
    public function __construct(
        private readonly EvaluationEngineInterface $evaluationEngine,
        private readonly AdaptiveTrainingService $adaptiveTrainingService,
        private readonly SkillProgressService $skillProgressService,
        private readonly MistakeTrackingService $mistakeTrackingService,
    ) {}

    public function startSession(User $user, Project $project): TrainingSession
    {
        $project->loadMissing('currentVersion');

        return TrainingSession::query()->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'project_version_id' => $project->current_version_id,
            'started_at' => Carbon::now(),
        ]);
    }

    public function nextTask(User $user, Project $project, ?int $sessionId = null): ?TaskVersion
    {
        return $this->adaptiveTrainingService->selectNextTask($user, $project);
    }

    /**
     * @param  array<string, mixed>  $answer
     * @return array{submission: Submission, evaluation: Evaluation, result: EvaluationResult, next_task: TaskVersion|null}
     */
    public function submitPractice(
        User $user,
        TaskVersion $taskVersion,
        array $answer,
        ?int $trainingSessionId = null,
    ): array {
        $taskVersion->loadMissing('task.project.currentVersion', 'projectVersion');
        $project = $taskVersion->task->project;
        $rubricVersion = $this->resolveRubricVersion($project);

        return DB::transaction(function () use ($user, $taskVersion, $answer, $trainingSessionId, $project, $rubricVersion) {
            $submission = Submission::query()->create([
                'user_id' => $user->id,
                'task_version_id' => $taskVersion->id,
                'project_version_id' => $taskVersion->project_version_id,
                'rubric_version_id' => $rubricVersion->id,
                'training_session_id' => $trainingSessionId,
                'mode' => SubmissionMode::Practice,
                'answer' => $answer,
                'submitted_at' => Carbon::now(),
            ]);

            $result = $this->persistEvaluation($submission, $taskVersion, $rubricVersion);

            $this->skillProgressService->updateFromEvaluation($user, $taskVersion, $result);
            $this->mistakeTrackingService->recordFromEvaluation($user, $project->id, $result);

            if ($trainingSessionId) {
                $session = TrainingSession::query()->lockForUpdate()->find($trainingSessionId);
                if ($session) {
                    $session->increment('tasks_attempted');
                    if ($result->passed) {
                        $session->increment('tasks_completed');
                    }
                }
            }

            $nextTask = $this->adaptiveTrainingService->selectNextTask($user, $project, $taskVersion->id);

            Log::info('evaluation.completed', [
                'submission_id' => $submission->id,
                'user_id' => $user->id,
                'score' => $result->score,
            ]);

            return [
                'submission' => $submission->fresh(['evaluation.criterionScores']),
                'evaluation' => $submission->evaluation,
                'result' => $result,
                'next_task' => $nextTask,
            ];
        });
    }

    private function resolveRubricVersion(Project $project): RubricVersion
    {
        $project->loadMissing('rubrics.currentVersion');
        $rubric = $project->rubrics()->firstOrFail();

        return $rubric->currentVersion ?? $rubric->versions()->where('active', true)->latest('version_number')->firstOrFail();
    }

    private function persistEvaluation(
        Submission $submission,
        TaskVersion $taskVersion,
        RubricVersion $rubricVersion,
    ): EvaluationResult {
        Log::info('evaluation.started', ['submission_id' => $submission->id]);

        $result = $this->evaluationEngine->evaluate($taskVersion, $submission, $rubricVersion);

        $evaluation = Evaluation::query()->create([
            'submission_id' => $submission->id,
            'project_version_id' => $submission->project_version_id,
            'task_version_id' => $submission->task_version_id,
            'rubric_version_id' => $rubricVersion->id,
            'evaluation_engine' => config('workbench.evaluation.driver', 'local'),
            'evaluation_engine_version' => config('workbench.evaluation.engine_version', '1.0.0'),
            'evaluation_rules_version' => config('workbench.evaluation.rules_version', '1.0.0'),
            'score' => $result->score,
            'passed' => $result->passed,
            'decision_correct' => $result->decisionCorrect,
            'result_payload' => $result->toArray(),
        ]);

        foreach ($result->criterionScores as $criterionScore) {
            EvaluationCriterionScore::query()->create([
                'evaluation_id' => $evaluation->id,
                'rubric_criterion_id' => $criterionScore->rubricCriterionId,
                'criterion_name' => $criterionScore->criterion,
                'score' => $criterionScore->score,
                'weight' => $criterionScore->weight,
                'passed' => $criterionScore->passed,
                'reason' => $criterionScore->reason,
            ]);
        }

        return $result;
    }
}
