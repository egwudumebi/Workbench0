<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLearnerDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_learner_dossier(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();
        $learner = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/admin/learners/{$learner->id}")
            ->assertOk()
            ->assertJsonPath('data.user.email', 'learner@workbench0.local')
            ->assertJsonStructure([
                'data' => [
                    'user',
                    'academy_profile' => ['xp', 'level', 'streak_days'],
                    'stats',
                    'enrolments',
                    'recent_submissions',
                ],
            ]);
    }

    public function test_admin_cannot_view_admin_user_as_learner(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/admin/learners/{$admin->id}")
            ->assertNotFound();
    }

    public function test_admin_can_list_learners_with_profile_fields(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/learners')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'level',
                        'xp',
                        'enrolments_count',
                        'active_enrolments',
                    ],
                ],
                'meta' => ['total'],
            ]);
    }

    public function test_admin_can_enrol_learner_in_programme(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();
        $learner = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $program = \App\Models\TrainingProgram::query()->where('slug', 'ai-evaluation-fundamentals')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/learners/{$learner->id}/enrolments", [
                'training_program_id' => $program->id,
            ])
            ->assertSuccessful();

        $this->assertDatabaseHas('program_enrolments', [
            'user_id' => $learner->id,
            'training_program_id' => $program->id,
            'status' => 'active',
        ]);
    }
}
