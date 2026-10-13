<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description');
            $table->string('audience')->nullable();
            $table->json('learning_objectives')->nullable();
            $table->string('source_classification')->default('admin_reviewed');
            $table->date('last_reviewed_at')->nullable();
            $table->unsignedSmallInteger('estimated_hours')->default(4);
            $table->string('difficulty')->default('intermediate');
            $table->json('prerequisites')->nullable();
            $table->json('learning_outcomes')->nullable();
            $table->json('skills_covered')->nullable();
            $table->string('status')->default('published');
            $table->boolean('featured')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('training_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_program_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['training_program_id', 'slug']);
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('training_program_id')->nullable()->after('project_id')->constrained()->nullOnDelete();
            $table->foreignId('training_module_id')->nullable()->after('training_program_id')->constrained()->nullOnDelete();
            $table->string('summary')->nullable()->after('title');
            $table->unsignedSmallInteger('estimated_minutes')->nullable()->after('content');
            $table->string('video_url')->nullable()->after('estimated_minutes');
            $table->string('caption_url')->nullable()->after('video_url');
            $table->longText('transcript')->nullable()->after('caption_url');
            $table->json('learning_objectives')->nullable()->after('transcript');
            $table->json('completion_criteria')->nullable()->after('learning_objectives');
        });

        Schema::create('program_enrolments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('training_program_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('active');
            $table->decimal('progress_percent', 5, 2)->default(0);
            $table->timestamp('enrolled_at');
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'training_program_id']);
        });

        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('not_started');
            $table->unsignedInteger('video_position_seconds')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id']);
        });

        Schema::create('video_checkpoints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('timestamp_seconds');
            $table->string('question');
            $table->json('options');
            $table->string('correct_answer');
            $table->text('explanation')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('checkpoint_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('video_checkpoint_id')->constrained()->cascadeOnDelete();
            $table->string('answer');
            $table->boolean('is_correct');
            $table->timestamps();

            $table->unique(['user_id', 'video_checkpoint_id']);
        });

        Schema::create('lesson_quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->timestamps();
        });

        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_quiz_id')->constrained()->cascadeOnDelete();
            $table->string('question');
            $table->json('options');
            $table->string('correct_answer');
            $table->text('explanation')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_quiz_id')->constrained()->cascadeOnDelete();
            $table->json('answers');
            $table->unsignedTinyInteger('score_percent');
            $table->boolean('passed');
            $table->timestamps();

            $table->unique(['user_id', 'lesson_quiz_id']);
        });

        Schema::create('practice_challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_program_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('slug');
            $table->string('mode');
            $table->string('title');
            $table->text('instructions')->nullable();
            $table->unsignedTinyInteger('difficulty')->default(2);
            $table->json('content');
            $table->json('answer_key');
            $table->json('skill_slugs')->nullable();
            $table->boolean('active')->default(true);
            $table->boolean('is_daily')->default(false);
            $table->timestamps();

            $table->unique(['slug']);
        });

        Schema::create('practice_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('practice_challenge_id')->constrained()->cascadeOnDelete();
            $table->json('submission');
            $table->unsignedTinyInteger('score_percent')->nullable();
            $table->json('feedback')->nullable();
            $table->boolean('passed')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'practice_challenge_id']);
        });

        Schema::create('learner_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('xp')->default(0);
            $table->unsignedSmallInteger('level')->default(1);
            $table->unsignedSmallInteger('streak_days')->default(0);
            $table->date('last_streak_date')->nullable();
            $table->json('preferences')->nullable();
            $table->timestamps();
        });

        Schema::create('xp_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('event_type');
            $table->string('source_type');
            $table->unsignedBigInteger('source_id');
            $table->unsignedSmallInteger('points');
            $table->timestamps();

            $table->unique(['user_id', 'event_type', 'source_type', 'source_id'], 'xp_events_unique_reward');
        });

        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description');
            $table->string('icon')->nullable();
            $table->string('criteria_type');
            $table->unsignedInteger('criteria_value')->default(1);
            $table->unsignedSmallInteger('xp_reward')->default(0);
            $table->timestamps();
        });

        Schema::create('user_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('achievement_id')->constrained()->cascadeOnDelete();
            $table->timestamp('earned_at');
            $table->timestamps();

            $table->unique(['user_id', 'achievement_id']);
        });

        Schema::create('academies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('target_platform')->nullable();
            $table->string('experience_level')->nullable();
            $table->json('learning_goals')->nullable();
            $table->string('status')->default('draft');
            $table->unsignedBigInteger('published_curriculum_version_id')->nullable();
            $table->boolean('authorized_upload')->default(false);
            $table->timestamps();
        });

        Schema::create('guideline_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('original_filename');
            $table->string('disk_path');
            $table->string('mime_type');
            $table->unsignedBigInteger('size_bytes');
            $table->longText('extracted_text')->nullable();
            $table->boolean('ocr_required')->default(false);
            $table->boolean('extraction_failed')->default(false);
            $table->timestamp('uploaded_at');
            $table->timestamps();
        });

        Schema::create('academy_generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('guideline_document_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('pending');
            $table->string('provider')->default('local');
            $table->text('error_message')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('extracted_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guideline_document_id')->constrained()->cascadeOnDelete();
            $table->string('rule_key');
            $table->text('rule_text');
            $table->string('section_ref')->nullable();
            $table->string('category')->nullable();
            $table->string('importance')->default('medium');
            $table->string('review_status')->default('confirmed');
            $table->decimal('confidence', 4, 2)->default(1);
            $table->json('related_objectives')->nullable();
            $table->timestamps();
        });

        Schema::create('curriculum_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('version_number');
            $table->json('structure');
            $table->json('ambiguities')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['academy_id', 'version_number']);
        });

        Schema::create('source_references', function (Blueprint $table) {
            $table->id();
            $table->string('referable_type');
            $table->unsignedBigInteger('referable_id');
            $table->foreignId('guideline_document_id')->nullable()->constrained()->nullOnDelete();
            $table->string('section_ref')->nullable();
            $table->string('page_ref')->nullable();
            $table->text('excerpt')->nullable();
            $table->timestamps();

            $table->index(['referable_type', 'referable_id']);
        });

        Schema::table('academies', function (Blueprint $table) {
            $table->foreign('published_curriculum_version_id')
                ->references('id')
                ->on('curriculum_versions')
                ->nullOnDelete();
        });

        Schema::create('integrity_acknowledgements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('training_program_id')->nullable()->constrained()->nullOnDelete();
            $table->string('context');
            $table->string('rules_version')->default('1.0');
            $table->timestamp('acknowledged_at');
            $table->timestamps();

            $table->unique(['user_id', 'context', 'rules_version']);
        });
    }

    public function down(): void
    {
        Schema::table('academies', function (Blueprint $table) {
            $table->dropForeign(['published_curriculum_version_id']);
        });

        Schema::dropIfExists('integrity_acknowledgements');
        Schema::dropIfExists('source_references');
        Schema::dropIfExists('curriculum_versions');
        Schema::dropIfExists('extracted_rules');
        Schema::dropIfExists('academy_generations');
        Schema::dropIfExists('guideline_documents');
        Schema::dropIfExists('academies');
        Schema::dropIfExists('user_achievements');
        Schema::dropIfExists('achievements');
        Schema::dropIfExists('xp_events');
        Schema::dropIfExists('learner_profiles');
        Schema::dropIfExists('practice_attempts');
        Schema::dropIfExists('practice_challenges');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('lesson_quizzes');
        Schema::dropIfExists('checkpoint_responses');
        Schema::dropIfExists('video_checkpoints');
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('program_enrolments');
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropConstrainedForeignId('training_program_id');
            $table->dropConstrainedForeignId('training_module_id');
            $table->dropColumn([
                'summary',
                'estimated_minutes',
                'video_url',
                'caption_url',
                'transcript',
                'learning_objectives',
                'completion_criteria',
            ]);
        });
        Schema::dropIfExists('training_modules');
        Schema::dropIfExists('training_programs');
    }
};
