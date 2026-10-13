<?php

namespace Tests\Unit;

use App\Models\RubricCriterion;
use App\Models\RubricVersion;
use App\Models\Submission;
use App\Models\TaskVersion;
use App\Services\Evaluation\LocalEvaluationEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocalEvaluationEngineTest extends TestCase
{
    use RefreshDatabase;

    public function test_evaluation_is_deterministic(): void
    {
        $this->seed();

        $taskVersion = TaskVersion::query()->firstOrFail();
        $rubricVersion = RubricVersion::query()->firstOrFail();

        $submission = new Submission([
            'answer' => [
                'decision' => $taskVersion->expected_output['decision'],
                'explanation' => 'This response is incorrect because it states a factual error about the capital city.',
            ],
        ]);

        $engine = new LocalEvaluationEngine;
        $first = $engine->evaluate($taskVersion, $submission, $rubricVersion);
        $second = $engine->evaluate($taskVersion, $submission, $rubricVersion);

        $this->assertSame($first->score, $second->score);
        $this->assertSame($first->passed, $second->passed);
        $this->assertSame($first->decisionCorrect, $second->decisionCorrect);
    }

    public function test_incorrect_decision_fails_evaluation(): void
    {
        $this->seed();

        $taskVersion = TaskVersion::query()->firstOrFail();
        $rubricVersion = RubricVersion::query()->with('criteria')->firstOrFail();

        $submission = new Submission([
            'answer' => [
                'decision' => 'correct',
                'explanation' => str_repeat('Incorrect reasoning without substance. ', 3),
            ],
        ]);

        if (($taskVersion->expected_output['decision'] ?? '') === 'correct') {
            $this->markTestSkipped('First seeded task expects correct decision.');
        }

        $result = (new LocalEvaluationEngine)->evaluate($taskVersion, $submission, $rubricVersion);

        $this->assertFalse($result->decisionCorrect);
    }

    public function test_missing_explanation_triggers_mistake(): void
    {
        $this->seed();

        $taskVersion = TaskVersion::query()->firstOrFail();
        $rubricVersion = RubricVersion::query()->firstOrFail();

        $submission = new Submission([
            'answer' => [
                'decision' => $taskVersion->expected_output['decision'],
                'explanation' => '',
            ],
        ]);

        $result = (new LocalEvaluationEngine)->evaluate($taskVersion, $submission, $rubricVersion);

        $categories = collect($result->mistakes)->pluck('category')->all();
        $this->assertContains('explanation', $categories);
    }
}
