<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            DemoUserSeeder::class,
            ProjectSeeder::class,
            SkillSeeder::class,
            TaskTypeSeeder::class,
            RubricSeeder::class,
            LessonSeeder::class,
            TaskSeeder::class,
            AchievementSeeder::class,
            TrainingProgramSeeder::class,
            DemoLearnerAcademySeeder::class,
        ]);
    }
}
