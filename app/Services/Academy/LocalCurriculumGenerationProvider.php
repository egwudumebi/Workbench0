<?php

namespace App\Services\Academy;

use App\Contracts\Academy\CurriculumGenerationProvider;
use App\Models\Academy;
use App\Models\GuidelineDocument;

class LocalCurriculumGenerationProvider implements CurriculumGenerationProvider
{
    public function generate(Academy $academy, GuidelineDocument $document, array $analysis): array
    {
        $rules = $analysis['rules'] ?? [];
        $modules = [
            [
                'slug' => 'orientation',
                'title' => 'Orientation',
                'description' => 'Understand the scope of your uploaded guidelines and how to study them.',
                'sort_order' => 1,
            ],
            [
                'slug' => 'foundations',
                'title' => 'Foundational Concepts',
                'description' => 'Core vocabulary, definitions, and evaluation principles from your document.',
                'sort_order' => 2,
            ],
        ];

        $lessons = [
            $this->lesson('welcome', 'Welcome to Your Academy', 'orientation', 1, $academy, $document, 'Overview of your personalised learning path.'),
            $this->lesson('foundations-1', 'Key Definitions and Scope', 'foundations', 2, $academy, $document, 'Terms and boundaries extracted from your guidelines.'),
        ];

        $graph = [
            ['node' => 'welcome', 'prerequisites' => []],
            ['node' => 'foundations-1', 'prerequisites' => ['welcome']],
        ];

        $ruleModuleOrder = 3;
        foreach (array_slice($rules, 0, 8) as $index => $rule) {
            $slug = 'rule-'.($index + 1);
            $modules[] = [
                'slug' => 'rules-'.($index + 1),
                'title' => 'Rule Module '.($index + 1),
                'description' => 'Study and apply: '.mb_substr($rule['text'], 0, 80).'…',
                'sort_order' => $ruleModuleOrder++,
            ];

            $lessons[] = $this->lesson(
                $slug,
                'Rule: '.mb_substr($rule['text'], 0, 60),
                'rules-'.($index + 1),
                count($lessons) + 1,
                $academy,
                $document,
                $rule['text'],
                $rule['section_ref'] ?? null,
            );

            $graph[] = [
                'node' => $slug,
                'prerequisites' => $index === 0 ? ['foundations-1'] : ['rule-'.$index],
            ];
        }

        $modules[] = [
            'slug' => 'practice',
            'title' => 'Guided & Independent Practice',
            'description' => 'Apply the rules in structured exercises.',
            'sort_order' => $ruleModuleOrder,
        ];

        $lessons[] = $this->lesson('guided-practice', 'Guided Practice', 'practice', count($lessons) + 1, $academy, $document, 'Walk through an example evaluation using your rules.');
        $lessons[] = $this->lesson('independent-practice', 'Independent Practice', 'practice', count($lessons) + 2, $academy, $document, 'Evaluate a response on your own and compare with rubric-aligned feedback.');
        $lessons[] = $this->lesson('final-assessment', 'Final Assessment', 'practice', count($lessons) + 3, $academy, $document, 'Demonstrate mastery across the extracted rules.');

        $graph[] = ['node' => 'guided-practice', 'prerequisites' => $graph !== [] ? [end($graph)['node']] : ['foundations-1']];
        $graph[] = ['node' => 'independent-practice', 'prerequisites' => ['guided-practice']];
        $graph[] = ['node' => 'final-assessment', 'prerequisites' => ['independent-practice']];

        return [
            'modules' => $modules,
            'lessons' => $lessons,
            'learning_graph' => $graph,
            'ambiguities' => $analysis['ambiguities'] ?? [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function lesson(
        string $slug,
        string $title,
        string $moduleSlug,
        int $sort,
        Academy $academy,
        GuidelineDocument $document,
        string $body,
        ?string $sectionRef = null,
    ): array {
        return [
            'slug' => $slug,
            'title' => $title,
            'module_slug' => $moduleSlug,
            'sort_order' => $sort,
            'summary' => mb_substr($body, 0, 160),
            'content' => "# {$title}\n\n{$body}\n\n## Your task\n\nApply this rule when evaluating responses. Cite evidence from the response and connect it back to the guideline.",
            'estimated_minutes' => 12,
            'learning_objectives' => ['Interpret the rule in context', 'Apply the rule to a sample response'],
            'source_reference' => [
                'document_id' => $document->id,
                'section_ref' => $sectionRef,
                'excerpt' => mb_substr($body, 0, 240),
            ],
            'completion_criteria' => ['Read the lesson', 'Complete the knowledge check'],
        ];
    }
}
