<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Skill;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SkillSeeder extends Seeder
{
    /**
     * @return array<int, array{slug: string, name: string, description: string}>
     */
    private function skills(): array
    {
        return [
            [
                'slug' => 'factual-accuracy',
                'name' => 'Factual Accuracy',
                'description' => 'Detect incorrect claims, fabricated details, and misleading statements in AI responses.',
            ],
            [
                'slug' => 'instruction-following',
                'name' => 'Instruction Following',
                'description' => 'Judge whether the response obeyed format, scope, tone, and constraint requirements in the prompt.',
            ],
            [
                'slug' => 'relevance',
                'name' => 'Relevance',
                'description' => 'Determine whether the response addresses the user question without unnecessary or off-topic content.',
            ],
            [
                'slug' => 'reasoning-quality',
                'name' => 'Reasoning Quality',
                'description' => 'Evaluate whether conclusions follow logically from premises and whether steps are sound.',
            ],
            [
                'slug' => 'evidence-evaluation',
                'name' => 'Evidence Evaluation',
                'description' => 'Assess whether claims are supported with appropriate evidence, examples, or citations.',
            ],
            [
                'slug' => 'response-completeness',
                'name' => 'Response Completeness',
                'description' => 'Identify missing steps, unanswered sub-questions, or truncated explanations.',
            ],
            [
                'slug' => 'decision-accuracy',
                'name' => 'Decision Accuracy',
                'description' => 'Select the correct overall rating or comparison outcome for a task.',
            ],
            [
                'slug' => 'explanation-quality',
                'name' => 'Explanation Quality',
                'description' => 'Write clear, specific justifications that cite concrete issues or strengths in the response.',
            ],
            [
                'slug' => 'consistency',
                'name' => 'Consistency',
                'description' => 'Ensure the written explanation aligns with the selected rating and rubric criteria.',
            ],
        ];
    }

    public function run(): void
    {
        $project = Project::query()->where('slug', 'ai-response-evaluation')->firstOrFail();

        DB::transaction(function () use ($project) {
            foreach ($this->skills() as $skill) {
                Skill::query()->updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'slug' => $skill['slug'],
                    ],
                    [
                        'name' => $skill['name'],
                        'description' => $skill['description'],
                        'active' => true,
                    ]
                );
            }
        });
    }
}
