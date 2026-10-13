<?php

namespace Database\Seeders;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\ProjectVersion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $project = Project::query()->updateOrCreate(
                ['slug' => 'ai-response-evaluation'],
                [
                    'name' => 'AI Response Evaluation',
                    'description' => 'Train evaluators to rate AI-generated responses for factual accuracy, instruction following, relevance, and reasoning quality.',
                    'instructions' => <<<'TEXT'
Review each AI response against the user prompt and project rubric. Select the appropriate rating, then explain your decision with specific references to the response. Focus on what the response got wrong or right—not on rewriting the answer.
TEXT,
                    'status' => ProjectStatus::Active,
                ]
            );

            $version = ProjectVersion::query()->updateOrCreate(
                [
                    'project_id' => $project->id,
                    'version_number' => 1,
                ],
                [
                    'name' => 'Version 1',
                    'description' => 'Initial AI Response Evaluation training standards.',
                    'changelog' => 'Initial release with binary, multi-class, pairwise, and combined evaluation task types.',
                    'is_current' => true,
                    'published_at' => now(),
                ]
            );

            ProjectVersion::query()
                ->where('project_id', $project->id)
                ->where('id', '!=', $version->id)
                ->update(['is_current' => false]);

            $project->update(['current_version_id' => $version->id]);
        });
    }
}
