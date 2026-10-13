<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Project;
use App\Models\TaskVersion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_security_headers_are_present(): void
    {
        $response = $this->get('/health');

        $response->assertOk();
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    public function test_learner_cannot_view_another_users_assessment(): void
    {
        $this->seed();

        $learner = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $other = User::factory()->create(['role' => 'learner']);

        $project = Project::query()->firstOrFail();
        $assessment = Assessment::query()->create([
            'user_id' => $learner->id,
            'project_id' => $project->id,
            'project_version_id' => $project->current_version_id,
            'status' => 'in_progress',
            'task_count' => 5,
            'started_at' => now(),
        ]);

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/v1/assessments/{$assessment->id}")
            ->assertForbidden();
    }

    public function test_cannot_submit_inactive_task(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $taskVersion = TaskVersion::query()->firstOrFail();
        $taskVersion->update(['active' => false]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/training/tasks/{$taskVersion->id}/submit", [
                'decision' => 'incorrect',
                'explanation' => 'Testing inactive task submission path.',
            ])
            ->assertForbidden();
    }
}
