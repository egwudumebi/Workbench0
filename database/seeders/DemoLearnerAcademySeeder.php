<?php

namespace Database\Seeders;

use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\ProgramEnrolment;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Services\Academy\GamificationService;
use Illuminate\Database\Seeder;

class DemoLearnerAcademySeeder extends Seeder
{
    public function run(): void
    {
        $learner = User::query()->where('email', 'learner@workbench0.local')->first();
        if (! $learner) {
            return;
        }

        $program = TrainingProgram::query()->where('slug', 'ai-evaluation-fundamentals')->first();
        if (! $program) {
            return;
        }

        ProgramEnrolment::query()->updateOrCreate(
            ['user_id' => $learner->id, 'training_program_id' => $program->id],
            [
                'status' => 'active',
                'progress_percent' => 25,
                'enrolled_at' => now()->subDays(3),
                'last_activity_at' => now()->subDay(),
            ]
        );

        $lesson = Lesson::query()->where('slug', 'eval-fundamentals-video')->first();
        if ($lesson) {
            LessonProgress::query()->updateOrCreate(
                ['user_id' => $learner->id, 'lesson_id' => $lesson->id],
                [
                    'status' => 'in_progress',
                    'video_position_seconds' => 4,
                    'updated_at' => now()->subDay(),
                ]
            );
            LessonProgress::query()
                ->where('user_id', $learner->id)
                ->where('lesson_id', $lesson->id)
                ->update(['updated_at' => now()->subDay()]);
        }

        app(GamificationService::class)->profile($learner)->update([
            'xp' => 120,
            'level' => 1,
            'streak_days' => 2,
            'last_streak_date' => now()->toDateString(),
        ]);
    }
}
