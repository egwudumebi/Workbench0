<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\ProgramEnrolment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLessonInteractiveTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_lesson_checkpoints_and_quiz(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();
        $lesson = Lesson::query()->whereHas('checkpoints')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/admin/lessons/{$lesson->id}")
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'checkpoints',
                    'quiz' => ['questions'],
                ],
            ]);

        $checkpointResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/lessons/{$lesson->id}/checkpoints", [
                'timestamp_seconds' => 99,
                'question' => 'Admin checkpoint?',
                'options' => ['Yes', 'No'],
                'correct_answer' => 'Yes',
            ])
            ->assertCreated()
            ->assertJsonPath('data.question', 'Admin checkpoint?');

        $checkpointId = $checkpointResponse->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/video-checkpoints/{$checkpointId}", [
                'timestamp_seconds' => 100,
                'question' => 'Updated checkpoint?',
                'options' => ['A', 'B'],
                'correct_answer' => 'A',
            ])
            ->assertOk()
            ->assertJsonPath('data.timestamp_seconds', 100);

        $quizResponse = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/lessons/{$lesson->id}/quiz", [
                'title' => 'Admin Quiz Title',
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Admin Quiz Title');

        $quizId = $quizResponse->json('data.id');

        $questionResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/lesson-quizzes/{$quizId}/questions", [
                'question' => 'New admin question?',
                'options' => ['One', 'Two'],
                'correct_answer' => 'One',
            ])
            ->assertCreated();

        $questionId = $questionResponse->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/quiz-questions/{$questionId}")
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/video-checkpoints/{$checkpointId}")
            ->assertOk();
    }

    public function test_admin_can_unenrol_learner(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();
        $learner = User::query()->where('email', 'learner@workbench0.local')->firstOrFail();
        $enrolment = ProgramEnrolment::query()->where('user_id', $learner->id)->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/learners/{$learner->id}/enrolments/{$enrolment->id}")
            ->assertOk()
            ->assertJsonPath('data.deleted', true);

        $this->assertDatabaseMissing('program_enrolments', ['id' => $enrolment->id]);
    }
}
