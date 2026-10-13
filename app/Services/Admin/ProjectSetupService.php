<?php

namespace App\Services\Admin;

use App\Models\Project;
use App\Models\ProjectVersion;
use App\Models\Rubric;
use App\Models\RubricCriterion;
use App\Models\RubricVersion;
use App\Models\Skill;
use App\Models\TaskType;
use App\Support\TaskTypeSchema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProjectSetupService
{
    public function bootstrap(Project $project, ?string $templateSlug = 'ai-response-evaluation'): Project
    {
        return DB::transaction(function () use ($project, $templateSlug) {
            $version = ProjectVersion::query()->create([
                'project_id' => $project->id,
                'version_number' => 1,
                'name' => 'Version 1',
                'description' => 'Initial project version.',
                'changelog' => 'Created from admin.',
                'is_current' => true,
                'published_at' => now(),
            ]);

            $project->update(['current_version_id' => $version->id]);

            if ($templateSlug) {
                $template = Project::query()->where('slug', $templateSlug)->first();
                if ($template) {
                    $this->cloneFromTemplate($project, $template);
                }
            }

            return $project->fresh(['currentVersion', 'taskTypes', 'skills']);
        });
    }

    private function cloneFromTemplate(Project $target, Project $template): void
    {
        $template->load(['taskTypes', 'skills', 'rubrics.currentVersion.criteria']);

        foreach ($template->taskTypes as $taskType) {
            $schema = TaskTypeSchema::withDisplay($taskType->schema ?? [], $taskType->slug);

            TaskType::query()->updateOrCreate(
                [
                    'project_id' => $target->id,
                    'slug' => $taskType->slug,
                ],
                [
                    'name' => $taskType->name,
                    'schema' => $schema,
                ]
            );
        }

        foreach ($template->skills as $skill) {
            Skill::query()->updateOrCreate(
                [
                    'project_id' => $target->id,
                    'slug' => $skill->slug,
                ],
                [
                    'name' => $skill->name,
                    'description' => $skill->description,
                    'active' => true,
                ]
            );
        }

        $templateRubric = $template->rubrics->first();
        if (! $templateRubric?->currentVersion) {
            return;
        }

        $rubric = Rubric::query()->updateOrCreate(
            [
                'project_id' => $target->id,
                'slug' => $templateRubric->slug ?? Str::slug($target->name).'-rubric',
            ],
            [
                'name' => $templateRubric->name,
                'description' => $templateRubric->description,
                'active' => true,
            ]
        );

        $rubricVersion = RubricVersion::query()->updateOrCreate(
            [
                'rubric_id' => $rubric->id,
                'version_number' => 1,
            ],
            [
                'project_version_id' => $target->current_version_id,
                'name' => $templateRubric->currentVersion->name,
                'description' => $templateRubric->currentVersion->description,
                'active' => true,
            ]
        );

        $rubric->update(['current_version_id' => $rubricVersion->id]);

        foreach ($templateRubric->currentVersion->criteria as $criterion) {
            RubricCriterion::query()->updateOrCreate(
                [
                    'rubric_version_id' => $rubricVersion->id,
                    'name' => $criterion->name,
                ],
                [
                    'description' => $criterion->description,
                    'weight' => $criterion->weight,
                    'critical' => $criterion->critical,
                    'evaluation_rules' => $criterion->evaluation_rules,
                    'sort_order' => $criterion->sort_order,
                ]
            );
        }
    }
}
