<?php

namespace Tests\Feature;

use App\Models\PracticeChallenge;
use App\Models\TrainingProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AcademyWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_can_browse_and_enrol_in_programme(): void
    {
        $this->seed();
        $learner = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $program = TrainingProgram::query()->where('slug', 'ai-evaluation-fundamentals')->firstOrFail();

        $this->actingAs($learner, 'sanctum')
            ->getJson('/api/v1/programs')
            ->assertOk()
            ->assertJsonFragment(['slug' => 'ai-evaluation-fundamentals']);

        $this->actingAs($learner, 'sanctum')
            ->postJson("/api/v1/programs/{$program->id}/enrol")
            ->assertCreated();
    }

    public function test_practice_challenge_scoring_hides_answer_key(): void
    {
        $this->seed();
        $learner = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $challenge = PracticeChallenge::query()->where('slug', 'duel-refund-policy')->firstOrFail();

        $this->actingAs($learner, 'sanctum')
            ->getJson("/api/v1/practice-arena/challenges/{$challenge->id}")
            ->assertOk()
            ->assertJsonMissing(['answer_key']);

        $this->actingAs($learner, 'sanctum')
            ->postJson("/api/v1/practice-arena/challenges/{$challenge->id}/submit", [
                'submission' => [
                    'decision' => 'response_a',
                    'explanation' => 'Response A cites the actual return window with specific evidence.',
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.result.passed', true);
    }

    public function test_build_academy_upload_and_generate_local_curriculum(): void
    {
        $this->seed();
        Storage::fake('local');
        $learner = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();

        $create = $this->actingAs($learner, 'sanctum')
            ->postJson('/api/v1/my-academies', [
                'title' => 'Demo Academy',
                'authorized_upload' => true,
            ])
            ->assertCreated();

        $academyId = $create->json('data.id');

        $text = file_get_contents(database_path('seeders/data/sample_evaluator_guidelines.txt'));
        $file = UploadedFile::fake()->createWithContent('guidelines.txt', $text);

        $this->actingAs($learner, 'sanctum')
            ->post("/api/v1/my-academies/{$academyId}/documents", [
                'document' => $file,
                'authorized_upload' => true,
            ])
            ->assertCreated();

        $this->actingAs($learner, 'sanctum')
            ->postJson("/api/v1/my-academies/{$academyId}/generate")
            ->assertAccepted();

        $this->actingAs($learner, 'sanctum')
            ->getJson("/api/v1/my-academies/{$academyId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'review');

        $this->actingAs($learner, 'sanctum')
            ->postJson("/api/v1/my-academies/{$academyId}/publish")
            ->assertOk()
            ->assertJsonPath('data.status', 'published');
    }

    public function test_xp_not_awarded_twice_for_same_event(): void
    {
        $this->seed();
        $learner = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $challenge = PracticeChallenge::query()->where('slug', 'duel-refund-policy')->firstOrFail();

        $payload = [
            'submission' => [
                'decision' => 'response_a',
                'explanation' => 'Evidence-based explanation with policy citation here.',
            ],
        ];

        $this->actingAs($learner, 'sanctum')
            ->postJson("/api/v1/practice-arena/challenges/{$challenge->id}/submit", $payload)
            ->assertOk();

        $xpAfterFirst = $learner->fresh()->learnerProfile?->xp ?? 0;

        $this->actingAs($learner, 'sanctum')
            ->postJson("/api/v1/practice-arena/challenges/{$challenge->id}/submit", $payload)
            ->assertOk();

        $this->assertSame($xpAfterFirst, $learner->fresh()->learnerProfile?->xp);
    }
}
