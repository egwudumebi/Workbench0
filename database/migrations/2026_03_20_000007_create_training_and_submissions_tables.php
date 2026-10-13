<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->restrictOnDelete();
            $table->foreignId('project_version_id')->constrained()->restrictOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->unsignedSmallInteger('tasks_attempted')->default(0);
            $table->unsignedSmallInteger('tasks_completed')->default(0);
            $table->decimal('score', 5, 2)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'project_id']);
        });

        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_version_id')->constrained()->restrictOnDelete();
            $table->foreignId('project_version_id')->constrained()->restrictOnDelete();
            $table->foreignId('rubric_version_id')->constrained()->restrictOnDelete();
            $table->foreignId('training_session_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assessment_id')->nullable();
            $table->string('mode');
            $table->json('answer');
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->index(['user_id', 'task_version_id']);
            $table->index(['assessment_id', 'task_version_id']);
        });

        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('project_version_id')->constrained()->restrictOnDelete();
            $table->foreignId('task_version_id')->constrained()->restrictOnDelete();
            $table->foreignId('rubric_version_id')->constrained()->restrictOnDelete();
            $table->string('evaluation_engine');
            $table->string('evaluation_engine_version');
            $table->string('evaluation_rules_version');
            $table->decimal('score', 5, 2);
            $table->boolean('passed');
            $table->boolean('decision_correct')->default(false);
            $table->json('result_payload');
            $table->string('provider')->nullable();
            $table->string('model')->nullable();
            $table->string('prompt_version')->nullable();
            $table->string('input_hash')->nullable();
            $table->string('output_hash')->nullable();
            $table->unsignedInteger('latency_ms')->nullable();
            $table->unsignedInteger('token_usage')->nullable();
            $table->timestamps();
        });

        Schema::create('evaluation_criterion_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rubric_criterion_id')->nullable()->constrained()->nullOnDelete();
            $table->string('criterion_name');
            $table->decimal('score', 5, 2);
            $table->unsignedTinyInteger('weight');
            $table->boolean('passed');
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_criterion_scores');
        Schema::dropIfExists('evaluations');
        Schema::dropIfExists('submissions');
        Schema::dropIfExists('training_sessions');
    }
};
