<?php

namespace Tests\Feature;

use App\Models\TrainingProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProgramStructureTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_add_module_and_lesson_to_programme(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();
        $program = TrainingProgram::query()->where('slug', 'ai-evaluation-fundamentals')->firstOrFail();

        $moduleResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/training-programs/{$program->id}/modules", [
                'title' => 'Admin Test Module',
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Admin Test Module');

        $moduleId = $moduleResponse->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/training-modules/{$moduleId}/lessons", [
                'title' => 'Admin Test Lesson',
                'content' => '# Hello',
                'status' => 'draft',
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Admin Test Lesson');

        $this->assertDatabaseHas('lessons', [
            'training_program_id' => $program->id,
            'training_module_id' => $moduleId,
            'title' => 'Admin Test Lesson',
        ]);
    }
}
