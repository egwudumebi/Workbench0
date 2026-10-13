<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProjectBootstrapTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_project_with_template_bootstrap(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();
        $template = Project::query()->where('slug', 'ai-response-evaluation')->firstOrFail();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/projects', [
                'name' => 'Customer Support QA',
                'description' => 'Evaluate support responses.',
                'status' => 'draft',
                'template_slug' => 'ai-response-evaluation',
            ]);

        $response->assertCreated();

        $project = Project::query()->where('slug', 'customer-support-qa')->firstOrFail();

        $this->assertNotNull($project->current_version_id);
        $this->assertSame(
            $template->taskTypes()->count(),
            $project->taskTypes()->count()
        );
        $this->assertSame(
            $template->skills()->count(),
            $project->skills()->count()
        );

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/admin/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.tasks_count', 0)
            ->assertJsonCount($template->taskTypes()->count(), 'data.task_types');
    }

    public function test_admin_can_create_empty_project_without_template(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/projects', [
                'name' => 'Blank Project',
                'status' => 'draft',
                'template_slug' => null,
            ])
            ->assertCreated();

        $project = Project::query()->where('slug', 'blank-project')->firstOrFail();

        $this->assertNotNull($project->current_version_id);
        $this->assertSame(0, $project->taskTypes()->count());
    }
}
