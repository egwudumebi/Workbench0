<?php

namespace Database\Seeders;

use App\Enums\LessonStatus;
use App\Models\Lesson;
use App\Models\Project;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LessonSeeder extends Seeder
{
    /**
     * @return array<int, array{slug: string, title: string, content: string}>
     */
    private function lessons(): array
    {
        return [
            [
                'slug' => 'introduction-to-ai-response-evaluation',
                'title' => 'Introduction to AI Response Evaluation',
                'content' => <<<'MD'
# Introduction to AI Response Evaluation

Welcome to Workbench0. Your job as an evaluator is **not** to rewrite AI answers—it is to judge whether a response meets quality standards.

## What you are evaluating

Each task presents:

1. A **user prompt** (what was asked)
2. One or two **AI responses**
3. A **task type** that defines valid ratings

## Your deliverable

You must provide:

- A **decision** (rating or comparison choice)
- An **explanation** that cites specific evidence from the response

## Core principle

> A correct rating with weak reasoning is still a training failure on real projects.

Read the prompt first, then inspect the response line by line before choosing a rating.
MD,
            ],
            [
                'slug' => 'understanding-evaluation-criteria',
                'title' => 'Understanding Evaluation Criteria',
                'content' => <<<'MD'
# Understanding Evaluation Criteria

Rubrics break quality into weighted criteria. On this project, common criteria include:

| Criterion | Question to ask |
|-----------|-----------------|
| Factual Accuracy | Are claims true and verifiable? |
| Instruction Following | Did the model obey format and constraints? |
| Relevance | Does the answer address the actual question? |
| Reasoning Quality | Is the logic sound from premise to conclusion? |
| Completeness | Are all parts of the question answered? |

## Critical vs non-critical

Some criteria are **critical**. Missing them can fail a task even if other areas look fine.

Always check whether your selected rating matches the most serious issue in the response.
MD,
            ],
            [
                'slug' => 'evaluating-factual-accuracy',
                'title' => 'Evaluating Factual Accuracy',
                'content' => <<<'MD'
# Evaluating Factual Accuracy

Factual errors are among the most serious response failures.

## Common factual problems

- **Incorrect dates, numbers, or names**
- **Invented citations or studies**
- **Overgeneralizations** presented as fact
- **Confident tone** masking a false claim

## How to explain a factual error

1. Quote or paraphrase the incorrect claim
2. State why it is wrong
3. Provide the correct information if known

## Example pattern

> The response states that water boils at 50°C at sea level. This is incorrect; at standard atmospheric pressure water boils at approximately 100°C.

Avoid vague comments like "this seems wrong" without identifying the claim.
MD,
            ],
            [
                'slug' => 'evaluating-relevance',
                'title' => 'Evaluating Relevance',
                'content' => <<<'MD'
# Evaluating Relevance

A response can be fluent and still fail if it does not answer the question.

## Relevance checklist

- Does the opening address the user's intent?
- Is most of the content on-topic?
- Are tangents brief and purposeful?

## Partial relevance

Some responses mix useful and irrelevant material. Your rating should reflect the **dominant** quality, and your explanation should name both strengths and distractions.

## Red flags

- Answering a different question
- Excessive background the user did not request
- Ignoring the most important constraint in the prompt
MD,
            ],
            [
                'slug' => 'instruction-following',
                'title' => 'Instruction Following',
                'content' => <<<'MD'
# Instruction Following

Prompts often include constraints beyond the topic itself.

## Typical instructions

- Output format (bullets, JSON, table)
- Length limits
- Tone or audience
- Scope limits (only pros, no cons)
- Language requirements

## Evaluation rule

If the response violates an explicit instruction, that violation must appear in your explanation—even when the factual content is otherwise strong.

## Do not confuse

Instruction following is **not** the same as relevance. A response can be on-topic yet still ignore format or scope rules.
MD,
            ],
            [
                'slug' => 'reasoning-quality',
                'title' => 'Reasoning Quality',
                'content' => <<<'MD'
# Reasoning Quality

Reasoning quality measures whether conclusions follow from evidence and logic.

## Weak reasoning signals

- Correct answer reached by invalid steps
- Non sequiturs between paragraphs
- Circular arguments
- Hidden assumptions treated as facts

## Strong reasoning signals

- Clear premises and conclusions
- Explicit intermediate steps
- Appropriate uncertainty when evidence is limited

When rating reasoning, describe **where** the logic breaks—not just that you disagree with the conclusion.
MD,
            ],
            [
                'slug' => 'evidence-and-support',
                'title' => 'Evidence and Support',
                'content' => <<<'MD'
# Evidence and Support

Claims should be proportionate to the evidence provided.

## Evaluate evidence for

- Statistical statements
- Historical assertions
- Medical or legal advice
- Comparative claims ("best", "always", "never")

## Problems to flag

- Unsupported certainty
- Fake references
- Anecdotes presented as universal proof
- Missing citations where the prompt requested sources

Your explanation should say whether evidence is absent, insufficient, or misleading—not merely that you wanted more detail.
MD,
            ],
            [
                'slug' => 'writing-strong-evaluation-explanations',
                'title' => 'Writing Strong Evaluation Explanations',
                'content' => <<<'MD'
# Writing Strong Evaluation Explanations

Good explanations are **specific**, **structured**, and **aligned** with your rating.

## Template

1. State your rating
2. Identify the primary issue or strength
3. Point to concrete text in the response
4. Connect the issue to a rubric criterion
5. End with a brief improvement rule if the response failed

## Weak explanation

> This answer is bad and not helpful.

## Strong explanation

> The response is incorrect because it claims the Pacific Ocean is the smallest ocean. The smallest ocean is the Arctic Ocean. This is a factual accuracy failure.

Meet the minimum explanation length, but prioritize clarity over word count.
MD,
            ],
            [
                'slug' => 'common-evaluation-mistakes',
                'title' => 'Common Evaluation Mistakes',
                'content' => <<<'MD'
# Common Evaluation Mistakes

Avoid these patterns during practice and assessment:

## Rating mistakes

- Choosing **correct** because the tone is polite
- Ignoring a single critical factual error
- Using **both equal** in pairwise tasks when one response clearly wins

## Explanation mistakes

- Restating the user question without analyzing the response
- Listing issues that do not support the selected rating
- Mentioning prohibited reasoning (e.g., calling a response "accurate" when you rated it incorrect)

## Process mistakes

- Skipping the prompt constraints
- Evaluating what the model *should* have said instead of what it said
- Submitting before checking alignment between rating and explanation

Use feedback from practice tasks to update your personal checklist.
MD,
            ],
            [
                'slug' => 'preparing-for-an-assessment',
                'title' => 'Preparing for an Assessment',
                'content' => <<<'MD'
# Preparing for an Assessment

Assessment mode simulates real project conditions.

## What changes in assessment

- Mixed difficulty tasks
- No immediate feedback during the run
- Fixed task count and optional time limit
- Final score computed after submission

## Readiness signals

Before attempting an assessment, aim for:

- Stable skill mastery across critical areas
- Few recurring mistakes in the same category
- Consistent explanations that cite specific evidence

## Exam strategy

1. Read the full prompt including constraints
2. Choose the rating that matches the **worst critical issue**
3. Write the explanation immediately while details are fresh
4. Do a ten-second consistency check before moving on

Assessment results feed your readiness score—practice deliberately, not quickly.
MD,
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
            foreach ($this->lessons() as $index => $lesson) {
                Lesson::query()->updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'slug' => $lesson['slug'],
                    ],
                    [
                        'project_version_id' => $projectVersion->id,
                        'title' => $lesson['title'],
                        'content' => $lesson['content'],
                        'sort_order' => $index + 1,
                        'status' => LessonStatus::Published,
                    ]
                );
            }
        });
    }
}
