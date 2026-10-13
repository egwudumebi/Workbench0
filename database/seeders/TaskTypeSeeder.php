<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\TaskType;
use App\Support\TaskTypeSchema;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TaskTypeSeeder extends Seeder
{
    /**
     * @return array<int, array{slug: string, name: string, schema: array<string, mixed>}>
     */
    private function taskTypes(): array
    {
        return [
            [
                'slug' => 'binary_evaluation',
                'name' => 'Binary Evaluation',
                'schema' => [
                    'type' => 'object',
                    'title' => 'Binary Evaluation',
                    'description' => 'Rate the response as correct or incorrect.',
                    'properties' => [
                        'decision' => [
                            'type' => 'string',
                            'enum' => ['correct', 'incorrect'],
                            'title' => 'Rating',
                        ],
                        'explanation' => [
                            'type' => 'string',
                            'title' => 'Explanation',
                            'minLength' => 20,
                        ],
                    ],
                    'required' => ['decision'],
                ],
            ],
            [
                'slug' => 'multi_class_rating',
                'name' => 'Multi-Class Rating',
                'schema' => [
                    'type' => 'object',
                    'title' => 'Multi-Class Rating',
                    'description' => 'Rate the response using a multi-level quality scale.',
                    'properties' => [
                        'decision' => [
                            'type' => 'string',
                            'enum' => ['excellent', 'good', 'poor', 'unacceptable'],
                            'title' => 'Rating',
                        ],
                        'explanation' => [
                            'type' => 'string',
                            'title' => 'Explanation',
                            'minLength' => 20,
                        ],
                    ],
                    'required' => ['decision'],
                ],
            ],
            [
                'slug' => 'pairwise_comparison',
                'name' => 'Pairwise Comparison',
                'schema' => [
                    'type' => 'object',
                    'title' => 'Pairwise Comparison',
                    'description' => 'Compare two responses and select the better option.',
                    'properties' => [
                        'decision' => [
                            'type' => 'string',
                            'enum' => ['response_a', 'response_b', 'both_equal'],
                            'title' => 'Preferred Response',
                        ],
                        'explanation' => [
                            'type' => 'string',
                            'title' => 'Explanation',
                            'minLength' => 30,
                        ],
                    ],
                    'required' => ['decision'],
                ],
            ],
            [
                'slug' => 'combined_evaluation',
                'name' => 'Combined Evaluation',
                'schema' => [
                    'type' => 'object',
                    'title' => 'Combined Evaluation',
                    'description' => 'Provide both a rating and a written justification.',
                    'properties' => [
                        'decision' => [
                            'type' => 'string',
                            'enum' => ['correct', 'incorrect', 'excellent', 'good', 'poor', 'unacceptable'],
                            'title' => 'Rating',
                        ],
                        'explanation' => [
                            'type' => 'string',
                            'title' => 'Explanation',
                            'minLength' => 40,
                        ],
                    ],
                    'required' => ['decision', 'explanation'],
                ],
            ],
        ];
    }

    public function run(): void
    {
        $project = Project::query()->where('slug', 'ai-response-evaluation')->firstOrFail();

        DB::transaction(function () use ($project) {
            foreach ($this->taskTypes() as $taskType) {
                TaskType::query()->updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'slug' => $taskType['slug'],
                    ],
                    [
                        'name' => $taskType['name'],
                        'schema' => TaskTypeSchema::withDisplay($taskType['schema'], $taskType['slug']),
                    ]
                );
            }
        });
    }
}
