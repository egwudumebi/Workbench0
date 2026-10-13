<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_cannot_access_admin_routes(): void
    {
        $this->seed();
        $user = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/dashboard')
            ->assertForbidden();
    }

    public function test_admin_can_access_admin_dashboard(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'counts' => [
                        'learners',
                        'projects_active',
                        'training_programs_published',
                    ],
                    'recent_audit',
                ],
            ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/learners')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }
}
