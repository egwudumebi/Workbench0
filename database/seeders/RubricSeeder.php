<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Rubric;
use App\Models\RubricCriterion;
use App\Models\RubricVersion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RubricSeeder extends Seeder
{
    /**
     * @return array<int, array<string, mixed>>
     */
    private function criteria(): array
    {
        return [
            [
                'name' => 'Decision Accuracy',
                'description' => 'The selected rating matches the expected evaluation outcome for the task.',
                'weight' => 20,
                'critical' => true,
                'evaluation_rules' => [
                    'must_match_expected_decision' => true,
                ],
                'sort_order' => 1,
            ],
            [
                'name' => 'Factual Accuracy',
                'description' => 'The evaluation correctly identifies factual errors, fabrications, or unsupported claims.',
                'weight' => 15,
                'critical' => true,
                'evaluation_rules' => [
                    'must_identify_factual_issue_when_present' => true,
                ],
                'sort_order' => 2,
            ],
            [
                'name' => 'Instruction Following',
                'description' => 'The evaluation recognizes when the response violated explicit prompt constraints.',
                'weight' => 12,
                'critical' => false,
                'evaluation_rules' => [],
                'sort_order' => 3,
            ],
            [
                'name' => 'Relevance',
                'description' => 'The evaluation addresses whether the response stayed on topic and answered the question.',
                'weight' => 12,
                'critical' => false,
                'evaluation_rules' => [],
                'sort_order' => 4,
            ],
            [
                'name' => 'Reasoning Quality',
                'description' => 'The explanation demonstrates logical analysis of the response quality.',
                'weight' => 10,
                'critical' => false,
                'evaluation_rules' => [],
                'sort_order' => 5,
            ],
            [
                'name' => 'Evidence Evaluation',
                'description' => 'The evaluation notes missing, weak, or fabricated supporting evidence when relevant.',
                'weight' => 8,
                'critical' => false,
                'evaluation_rules' => [],
                'sort_order' => 6,
            ],
            [
                'name' => 'Response Completeness',
                'description' => 'The evaluation identifies missing steps, sub-answers, or truncated content.',
                'weight' => 8,
                'critical' => false,
                'evaluation_rules' => [],
                'sort_order' => 7,
            ],
            [
                'name' => 'Explanation Quality',
                'description' => 'The written justification is specific, actionable, and references concrete response details.',
                'weight' => 10,
                'critical' => false,
                'evaluation_rules' => [
                    'minimum_specificity' => 'high',
                ],
                'sort_order' => 8,
            ],
            [
                'name' => 'Consistency',
                'description' => 'The explanation supports and aligns with the selected rating.',
                'weight' => 5,
                'critical' => false,
                'evaluation_rules' => [],
                'sort_order' => 9,
            ],
        ];
    }

    public function run(): void
    {
        $project = Project::query()
            ->where('slug', 'ai-response-evaluation')
            ->with('currentVersion')
            ->firstOrFail();

        $projectVersion = $project->currentVersion;

        DB::transaction(function () use ($project, $projectVersion) {
            $rubric = Rubric::query()->updateOrCreate(
                [
                    'project_id' => $project->id,
                    'name' => 'AI Response Evaluation Rubric',
                ],
                []
            );

            $rubricVersion = RubricVersion::query()->updateOrCreate(
                [
                    'rubric_id' => $rubric->id,
                    'version_number' => 1,
                ],
                [
                    'project_version_id' => $projectVersion->id,
                    'name' => 'Version 1',
                    'active' => true,
                ]
            );

            foreach ($this->criteria() as $criterion) {
                RubricCriterion::query()->updateOrCreate(
                    [
                        'rubric_version_id' => $rubricVersion->id,
                        'name' => $criterion['name'],
                    ],
                    [
                        'description' => $criterion['description'],
                        'weight' => $criterion['weight'],
                        'critical' => $criterion['critical'],
                        'evaluation_rules' => $criterion['evaluation_rules'],
                        'sort_order' => $criterion['sort_order'],
                    ]
                );
            }

            $rubric->update(['current_version_id' => $rubricVersion->id]);
        });
    }
}
