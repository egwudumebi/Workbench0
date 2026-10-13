<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\TaskVersion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrainingFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_can_submit_practice_task_and_receive_evaluation(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $project = Project::query()->where('slug', 'ai-response-evaluation')->firstOrFail();
        $taskVersion = TaskVersion::query()->firstOrFail();
        $expected = $taskVersion->expected_output;

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/training/tasks/{$taskVersion->id}/submit", [
                'decision' => $expected['decision'],
                'explanation' => 'This response is incorrect because it contains a factual error and fails to answer accurately.',
            ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'submission',
                    'evaluation' => ['score', 'passed', 'feedback'],
                ],
            ]);

        $this->assertDatabaseHas('submissions', [
            'user_id' => $user->id,
            'task_version_id' => $taskVersion->id,
        ]);

        $this->assertDatabaseHas('evaluations', [
            'submission_id' => $response->json('data.submission.id'),
        ]);
    }

    public function test_learner_task_resource_hides_expected_output(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $project = Project::query()->where('slug', 'ai-response-evaluation')->firstOrFail();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/training/next-task?project_id='.$project->id);

        $response->assertOk();
        $this->assertArrayNotHasKey('expected_output', $response->json('data') ?? []);
    }
}
