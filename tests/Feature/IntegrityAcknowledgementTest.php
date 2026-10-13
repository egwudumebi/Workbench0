<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IntegrityAcknowledgementTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_can_acknowledge_assessment_integrity_rules(): void
    {
        $this->seed();
        $learner = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();

        $this->actingAs($learner, 'sanctum')
            ->getJson('/api/v1/integrity/assessment/status')
            ->assertOk()
            ->assertJsonPath('data.acknowledged', false);

        $this->actingAs($learner, 'sanctum')
            ->postJson('/api/v1/integrity/assessment/acknowledge', ['acknowledged' => true])
            ->assertOk();

        $this->actingAs($learner, 'sanctum')
            ->getJson('/api/v1/integrity/assessment/status')
            ->assertOk()
            ->assertJsonPath('data.acknowledged', true);
    }
}
