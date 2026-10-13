<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Skill;
use App\Models\Task;
use App\Models\TaskType;
use App\Models\TaskVersion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $project = Project::query()
            ->where('slug', 'ai-response-evaluation')
            ->with('currentVersion')
            ->firstOrFail();

        $projectVersion = $project->currentVersion;

        $taskTypes = TaskType::query()
            ->where('project_id', $project->id)
            ->get()
            ->keyBy('slug');

        $skills = Skill::query()
            ->where('project_id', $project->id)
            ->get()
            ->keyBy('slug');

        /** @var array<int, array<string, mixed>> $tasks */
        $tasks = require database_path('seeders/data/evaluation_tasks.php');

        DB::transaction(function () use ($tasks, $project, $projectVersion, $taskTypes, $skills) {
            foreach ($tasks as $definition) {
                $taskType = $taskTypes->get($definition['task_type']);

                if ($taskType === null) {
                    throw new \RuntimeException("Unknown task type: {$definition['task_type']}");
                }

                $task = Task::query()->updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'slug' => $definition['slug'],
                    ],
                    [
                        'task_type_id' => $taskType->id,
                        'title' => $definition['title'],
                        'active' => true,
                    ]
                );

                $taskVersion = TaskVersion::query()->updateOrCreate(
                    [
                        'task_id' => $task->id,
                        'version_number' => 1,
                    ],
                    [
                        'project_version_id' => $projectVersion->id,
                        'title' => $definition['title'],
                        'prompt' => $definition['prompt'],
                        'context' => $definition['context'] ?? null,
                        'response_a' => $definition['response_a'],
                        'response_b' => $definition['response_b'] ?? null,
                        'configuration' => $definition['configuration'],
                        'expected_output' => $definition['expected_output'],
                        'difficulty' => $definition['difficulty'],
                        'active' => true,
                    ]
                );

                $task->update(['current_version_id' => $taskVersion->id]);

                $skillPivot = [];

                foreach ($definition['skills'] as $index => $skillSlug) {
                    $skill = $skills->get($skillSlug);

                    if ($skill === null) {
                        throw new \RuntimeException("Unknown skill: {$skillSlug}");
                    }

                    $skillPivot[$skill->id] = [
                        'weight' => $definition['skill_weights'][$index] ?? 1,
                    ];
                }

                $task->skills()->sync($skillPivot);
            }
        });
    }
}
