<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['slug' => 'first-lesson', 'name' => 'First Lesson', 'description' => 'Complete your first academy lesson.', 'criteria_type' => 'lessons_completed', 'criteria_value' => 1, 'xp_reward' => 25],
            ['slug' => 'rubric-explorer', 'name' => 'Rubric Explorer', 'description' => 'Reach level 2.', 'criteria_type' => 'level_reached', 'criteria_value' => 2, 'xp_reward' => 30],
            ['slug' => 'accuracy-apprentice', 'name' => 'Accuracy Apprentice', 'description' => 'Pass 3 practice challenges.', 'criteria_type' => 'practice_passed', 'criteria_value' => 3, 'xp_reward' => 40],
            ['slug' => 'response-duel-champion', 'name' => 'Response Duel Champion', 'description' => 'Pass 5 practice challenges.', 'criteria_type' => 'practice_passed', 'criteria_value' => 5, 'xp_reward' => 50],
            ['slug' => 'consistency-builder', 'name' => 'Consistency Builder', 'description' => 'Earn 500 XP.', 'criteria_type' => 'xp_total', 'criteria_value' => 500, 'xp_reward' => 50],
            ['slug' => 'independent-evaluator', 'name' => 'Independent Evaluator', 'description' => 'Complete 5 lessons.', 'criteria_type' => 'lessons_completed', 'criteria_value' => 5, 'xp_reward' => 60],
            ['slug' => 'assessment-ready', 'name' => 'Assessment Ready', 'description' => 'Pass a final project assessment.', 'criteria_type' => 'assessments_passed', 'criteria_value' => 1, 'xp_reward' => 100],
        ];

        foreach ($items as $item) {
            Achievement::query()->updateOrCreate(['slug' => $item['slug']], $item);
        }
    }
}
