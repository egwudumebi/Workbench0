<?php

namespace Database\Seeders;

use App\Enums\LessonStatus;
use App\Enums\PracticeChallengeMode;
use App\Models\Lesson;
use App\Models\LessonQuiz;
use App\Models\PracticeChallenge;
use App\Models\Project;
use App\Models\QuizQuestion;
use App\Models\TrainingModule;
use App\Models\TrainingProgram;
use App\Models\VideoCheckpoint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TrainingProgramSeeder extends Seeder
{
    public function run(): void
    {
        $project = Project::query()->where('slug', 'ai-response-evaluation')->firstOrFail();
        $versionId = $project->current_version_id;

        DB::transaction(function () use ($project, $versionId) {
            $this->seedProgramA($project, $versionId);
            $this->seedProgramB($project, $versionId);
            $this->seedProgramC($project, $versionId);
            $this->seedPracticeChallenges();
        });
    }

    private function seedProgramA(Project $project, ?int $versionId): void
    {
        $program = TrainingProgram::query()->updateOrCreate(
            ['slug' => 'ai-evaluation-fundamentals'],
            [
                'project_id' => $project?->id,
                'name' => 'AI Evaluation Fundamentals',
                'description' => 'General, transferable skills for evaluating AI responses: rubrics, accuracy, relevance, reasoning, and clear justifications. Original Workbench0 educational content — not official partner training.',
                'audience' => 'New and aspiring AI response evaluators',
                'source_classification' => 'admin_reviewed_original',
                'last_reviewed_at' => now()->toDateString(),
                'estimated_hours' => 6,
                'difficulty' => 'beginner',
                'learning_objectives' => [
                    'Understand evaluation rubrics',
                    'Check instruction following and factual accuracy',
                    'Write evidence-based justifications',
                ],
                'learning_outcomes' => ['Rate responses consistently using a rubric', 'Identify unsupported claims'],
                'skills_covered' => ['instruction-following', 'factual-accuracy', 'evaluation-justification'],
                'status' => 'published',
                'featured' => true,
                'sort_order' => 1,
            ]
        );

        $module = TrainingModule::query()->updateOrCreate(
            ['training_program_id' => $program->id, 'slug' => 'core-skills'],
            ['title' => 'Core Evaluation Skills', 'description' => 'Foundational concepts', 'sort_order' => 1]
        );

        $lesson = $this->upsertLesson($program, $module, $project, $versionId, [
            'slug' => 'eval-fundamentals-video',
            'title' => 'What Good Evaluation Looks Like',
            'summary' => 'Video lesson with checkpoints on rubric-aligned judgment.',
            'sort_order' => 1,
            'video_url' => null,
            'caption_url' => '/academy/captions/evaluation-fundamentals.vtt',
            'transcript' => file_get_contents(public_path('academy/captions/evaluation-fundamentals.vtt')),
            'content' => "# What Good Evaluation Looks Like\n\nUse the rubric dimensions before choosing a rating.\n\n## Narrated lesson\n\nThis demonstration uses an accessible transcript and captions when a hosted video file is unavailable.",
            'estimated_minutes' => 15,
            'learning_objectives' => ['Define rubric-aligned evaluation', 'Cite response evidence'],
        ]);

        VideoCheckpoint::query()->updateOrCreate(
            ['lesson_id' => $lesson->id, 'timestamp_seconds' => 4],
            [
                'question' => 'What must you include in every evaluation explanation?',
                'options' => ['Personal opinion only', 'Specific evidence from the response', 'A rewritten answer'],
                'correct_answer' => 'Specific evidence from the response',
                'explanation' => 'Rubrics require traceable evidence, not preference alone.',
                'sort_order' => 1,
            ]
        );

        $quiz = LessonQuiz::query()->firstOrCreate(['lesson_id' => $lesson->id], ['title' => 'Knowledge Check']);
        QuizQuestion::query()->updateOrCreate(
            ['lesson_quiz_id' => $quiz->id, 'question' => 'A polite response with a factual error should be rated:'],
            [
                'options' => ['Excellent', 'Good', 'Poor or unacceptable depending on severity', 'Always acceptable'],
                'correct_answer' => 'Poor or unacceptable depending on severity',
                'explanation' => 'Factual errors cap quality even when tone is strong.',
                'sort_order' => 1,
            ]
        );

        $this->upsertLesson($program, $module, $project, $versionId, [
            'slug' => 'rubrics-and-evidence',
            'title' => 'Rubrics and Evidence',
            'summary' => 'Reading multi-dimensional rubrics.',
            'sort_order' => 2,
            'content' => "# Rubrics and Evidence\n\nDimensions must be scored independently then synthesised.",
            'estimated_minutes' => 20,
        ]);
    }

    private function seedProgramB(Project $project, ?int $versionId): void
    {
        $program = TrainingProgram::query()->updateOrCreate(
            ['slug' => 'comparative-response-evaluation'],
            [
                'project_id' => $project?->id,
                'name' => 'Comparative Response Evaluation',
                'description' => 'Compare fictional AI responses, apply criteria, justify preferences, and recognise ties.',
                'audience' => 'Learners preparing for pairwise comparison tasks',
                'source_classification' => 'admin_reviewed_original',
                'last_reviewed_at' => now()->toDateString(),
                'estimated_hours' => 4,
                'difficulty' => 'intermediate',
                'learning_objectives' => ['Compare responses on the same criteria', 'Justify preferences with evidence'],
                'skills_covered' => ['comparative-judgement', 'consistency'],
                'status' => 'published',
                'featured' => true,
                'sort_order' => 2,
            ]
        );

        $module = TrainingModule::query()->updateOrCreate(
            ['training_program_id' => $program->id, 'slug' => 'pairwise'],
            ['title' => 'Pairwise Comparison', 'sort_order' => 1, 'description' => 'Side-by-side evaluation']
        );

        $lesson = $this->upsertLesson($program, $module, $project, $versionId, [
            'slug' => 'comparative-video-intro',
            'title' => 'Comparing Responses Fairly',
            'summary' => 'Avoid preference bias when choosing between Response A and B.',
            'sort_order' => 1,
            'caption_url' => '/academy/captions/evaluation-fundamentals.vtt',
            'transcript' => 'Apply the same checklist to both responses before deciding.',
            'content' => "# Comparing Responses Fairly\n\nUse criterion-by-criterion comparison.",
            'estimated_minutes' => 12,
        ]);

        VideoCheckpoint::query()->updateOrCreate(
            ['lesson_id' => $lesson->id, 'timestamp_seconds' => 2],
            [
                'question' => 'When is a tie acceptable?',
                'options' => ['Whenever you are unsure', 'When differences are immaterial on the rubric', 'Never'],
                'correct_answer' => 'When differences are immaterial on the rubric',
                'explanation' => 'Ties should be justified against criteria, not convenience.',
                'sort_order' => 1,
            ]
        );
    }

    private function seedProgramC(Project $project, ?int $versionId): void
    {
        $program = TrainingProgram::query()->updateOrCreate(
            ['slug' => 'rubric-interpretation-qc'],
            [
                'project_id' => $project?->id,
                'name' => 'Rubric Interpretation and Quality Control',
                'description' => 'Interpret multi-dimensional rubrics, apply scoring rules, and review your own work.',
                'audience' => 'Intermediate evaluators',
                'source_classification' => 'admin_reviewed_original',
                'last_reviewed_at' => now()->toDateString(),
                'estimated_hours' => 5,
                'difficulty' => 'intermediate',
                'learning_objectives' => ['Apply explicit scoring rules', 'Self-review for consistency'],
                'skills_covered' => ['rubric-interpretation', 'consistency'],
                'status' => 'published',
                'sort_order' => 3,
            ]
        );

        $module = TrainingModule::query()->updateOrCreate(
            ['training_program_id' => $program->id, 'slug' => 'qc'],
            ['title' => 'Quality Control', 'sort_order' => 1, 'description' => 'Self-review workflows']
        );

        $this->upsertLesson($program, $module, $project, $versionId, [
            'slug' => 'qc-self-review',
            'title' => 'Self-Review Checklist',
            'summary' => 'Catch inconsistent ratings before submission.',
            'sort_order' => 1,
            'caption_url' => '/academy/captions/evaluation-fundamentals.vtt',
            'transcript' => 'Re-read the prompt, then verify each rubric dimension.',
            'content' => "# Self-Review Checklist\n\nRe-score if evidence does not support your label.",
            'estimated_minutes' => 18,
        ]);
    }

    private function seedPracticeChallenges(): void
    {
        $programA = TrainingProgram::query()->where('slug', 'ai-evaluation-fundamentals')->first();

        PracticeChallenge::query()->updateOrCreate(
            ['slug' => 'duel-refund-policy'],
            [
                'training_program_id' => $programA?->id,
                'mode' => PracticeChallengeMode::ResponseDuel,
                'title' => 'Response Duel: Refund Policy',
                'instructions' => 'Choose the stronger response and explain using rubric criteria.',
                'difficulty' => 2,
                'content' => [
                    'prompt' => 'User asks whether they can return a headset after 45 days.',
                    'response_a' => 'Our standard return window is 30 days; after that returns are not accepted unless defective.',
                    'response_b' => 'Sure, you can return anything anytime—we always say yes to keep customers happy!',
                ],
                'answer_key' => [
                    'decision' => 'response_a',
                    'min_explanation_length' => 20,
                    'rationale' => 'Response A follows policy; B invents permissive rules.',
                ],
                'skill_slugs' => ['factual-accuracy', 'instruction-following'],
                'is_daily' => true,
            ]
        );

        PracticeChallenge::query()->updateOrCreate(
            ['slug' => 'spot-error-hallucination'],
            [
                'training_program_id' => $programA?->id,
                'mode' => PracticeChallengeMode::SpotTheError,
                'title' => 'Spot the Error: Invented Statistic',
                'instructions' => 'Identify the primary error in the response.',
                'difficulty' => 2,
                'content' => [
                    'response' => 'Studies show 94% of users prefer our premium tier, so you should upgrade today for guaranteed savings.',
                    'errors' => [
                        ['id' => 'unsupported_stat', 'label' => 'Unsupported statistic presented as fact'],
                        ['id' => 'tone', 'label' => 'Tone is too casual'],
                    ],
                ],
                'answer_key' => [
                    'error_id' => 'unsupported_stat',
                    'explanation' => 'The response cites a precise statistic with no source.',
                ],
                'skill_slugs' => ['factual-accuracy'],
            ]
        );

        PracticeChallenge::query()->updateOrCreate(
            ['slug' => 'rule-match-basics'],
            [
                'mode' => PracticeChallengeMode::RuleMatch,
                'title' => 'Rule Match: Evaluation Basics',
                'instructions' => 'Match each example to the relevant rule.',
                'difficulty' => 1,
                'content' => [
                    'rules' => [
                        ['id' => 'cite', 'text' => 'Cite evidence from the response'],
                        ['id' => 'no_invent', 'text' => 'Do not invent policy facts'],
                    ],
                    'examples' => [
                        ['id' => 'ex1', 'text' => 'The answer claims a 90-day guarantee with no source.'],
                        ['id' => 'ex2', 'text' => 'Explanation quotes the sentence that contradicts the prompt.'],
                    ],
                ],
                'answer_key' => ['pairs' => ['ex1' => 'no_invent', 'ex2' => 'cite']],
                'skill_slugs' => ['rubric-interpretation'],
            ]
        );

        PracticeChallenge::query()->updateOrCreate(
            ['slug' => 'scenario-escalate'],
            [
                'mode' => PracticeChallengeMode::Scenario,
                'title' => 'Scenario: Missing Account Context',
                'instructions' => 'Choose the best evaluator action.',
                'difficulty' => 2,
                'content' => [
                    'scenario' => 'The prompt references an account ID but the response guesses billing details.',
                    'choices' => [
                        'approve_excellent' => 'Rate excellent for helpful tone',
                        'flag_uncertainty' => 'Flag uncertainty and note missing context',
                        'rewrite' => 'Rewrite the response yourself',
                    ],
                ],
                'answer_key' => [
                    'best_choice' => 'flag_uncertainty',
                    'acceptable_choices' => ['flag_uncertainty'],
                    'feedback' => [
                        'flag_uncertainty' => 'Correct: note missing context rather than inventing facts.',
                        'approve_excellent' => 'Tone does not compensate for unsupported billing details.',
                    ],
                ],
                'skill_slugs' => ['uncertainty-handling'],
            ]
        );

        PracticeChallenge::query()->updateOrCreate(
            ['slug' => 'boss-multi-skill'],
            [
                'training_program_id' => $programA?->id,
                'mode' => PracticeChallengeMode::Boss,
                'title' => 'Boss Challenge: Multi-Skill Evaluation',
                'instructions' => 'Complete all stages to finish the boss challenge.',
                'difficulty' => 4,
                'content' => ['intro' => 'Three quick evaluation decisions.'],
                'answer_key' => [
                    'stages' => [
                        ['answer' => 'incorrect', 'prompt' => 'Response contradicts the stated return policy.'],
                        ['answer' => 'response_a', 'prompt' => 'Pairwise: A is grounded; B is vague.'],
                        ['answer' => 'cite_evidence', 'prompt' => 'Best QC action before submit?'],
                    ],
                ],
                'skill_slugs' => ['comparative-judgement', 'consistency'],
            ]
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function upsertLesson(
        TrainingProgram $program,
        TrainingModule $module,
        Project $project,
        ?int $versionId,
        array $data,
    ): Lesson {
        return Lesson::query()->updateOrCreate(
            [
                'training_program_id' => $program->id,
                'slug' => $data['slug'],
            ],
            [
                'project_id' => $project->id,
                'project_version_id' => $versionId ?? $project->current_version_id,
                'training_module_id' => $module->id,
                'title' => $data['title'],
                'summary' => $data['summary'] ?? null,
                'content' => $data['content'],
                'sort_order' => $data['sort_order'],
                'status' => LessonStatus::Published,
                'estimated_minutes' => $data['estimated_minutes'] ?? 10,
                'video_url' => $data['video_url'] ?? null,
                'caption_url' => $data['caption_url'] ?? null,
                'transcript' => $data['transcript'] ?? null,
                'learning_objectives' => $data['learning_objectives'] ?? [],
            ]
        );
    }
}
