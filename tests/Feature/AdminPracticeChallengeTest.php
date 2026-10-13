<?php

namespace Tests\Feature;

use App\Models\PracticeChallenge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPracticeChallengeTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_and_create_practice_challenges(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/practice-challenges')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/practice-challenges', [
                'mode' => 'response_duel',
                'title' => 'Admin Test Duel',
                'difficulty' => 2,
                'content' => ['prompt' => 'Test', 'response_a' => 'A', 'response_b' => 'B'],
                'answer_key' => ['decision' => 'response_a'],
                'active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Admin Test Duel');

        $this->assertDatabaseHas('practice_challenges', [
            'title' => 'Admin Test Duel',
            'mode' => 'response_duel',
        ]);
    }

    public function test_admin_can_toggle_challenge_active_flag(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();
        $challenge = PracticeChallenge::query()->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/practice-challenges/{$challenge->id}", [
                'active' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.active', false);
    }
}
