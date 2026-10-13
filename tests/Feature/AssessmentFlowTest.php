<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\AssessmentSubmission;
use App\Models\AssessmentTask;
use App\Models\Project;
use App\Models\Submission;
use App\Models\TaskVersion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssessmentFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_current_returns_in_progress_assessment(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $project = Project::query()->firstOrFail();

        $assessment = Assessment::query()->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'project_version_id' => $project->current_version_id,
            'status' => 'in_progress',
            'task_count' => 2,
            'started_at' => now(),
        ]);

        $taskVersion = TaskVersion::query()->firstOrFail();

        AssessmentTask::query()->create([
            'assessment_id' => $assessment->id,
            'task_version_id' => $taskVersion->id,
            'sort_order' => 1,
        ]);

        AssessmentSubmission::query()->create([
            'assessment_id' => $assessment->id,
            'task_version_id' => $taskVersion->id,
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/assessments/current?project_id={$project->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $assessment->id);
        $response->assertJsonIsArray('data.tasks');
    }

    public function test_create_resumes_existing_in_progress_assessment(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $project = Project::query()->firstOrFail();

        $existing = Assessment::query()->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'project_version_id' => $project->current_version_id,
            'status' => 'in_progress',
            'task_count' => 2,
            'started_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/assessments', ['project_id' => $project->id]);

        $response->assertCreated();
        $response->assertJsonPath('data.id', $existing->id);
        $this->assertSame(1, Assessment::query()->where('user_id', $user->id)->where('status', 'in_progress')->count());
    }

    public function test_result_returns_completed_submissions(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $project = Project::query()->firstOrFail();
        $taskVersion = TaskVersion::query()->firstOrFail();

        $assessment = Assessment::query()->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'project_version_id' => $project->current_version_id,
            'status' => 'completed',
            'task_count' => 1,
            'started_at' => now(),
            'completed_at' => now(),
            'score' => 85,
            'passed' => true,
        ]);

        $submission = Submission::query()->create([
            'user_id' => $user->id,
            'task_version_id' => $taskVersion->id,
            'project_version_id' => $project->current_version_id,
            'rubric_version_id' => $project->rubrics()->firstOrFail()->current_version_id,
            'assessment_id' => $assessment->id,
            'mode' => 'assessment',
            'answer' => ['decision' => 'incorrect', 'explanation' => 'Test explanation for assessment result.'],
            'submitted_at' => now(),
        ]);

        AssessmentSubmission::query()->create([
            'assessment_id' => $assessment->id,
            'task_version_id' => $taskVersion->id,
            'sort_order' => 1,
            'submission_id' => $submission->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/assessments/{$assessment->id}/result");

        $response->assertOk();
        $response->assertJsonIsArray('data.submissions');
        $response->assertJsonPath('data.submissions.0.id', $submission->id);
    }
}
