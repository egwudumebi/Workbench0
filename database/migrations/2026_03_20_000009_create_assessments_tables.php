<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->restrictOnDelete();
            $table->foreignId('project_version_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('in_progress');
            $table->unsignedSmallInteger('task_count');
            $table->unsignedSmallInteger('time_limit_minutes')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->boolean('passed')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'project_id', 'status']);
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->foreign('assessment_id')
                ->references('id')
                ->on('assessments')
                ->nullOnDelete();
        });

        Schema::create('assessment_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_version_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('sort_order');
            $table->timestamps();

            $table->unique(['assessment_id', 'task_version_id']);
        });

        Schema::create('assessment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_version_id')->constrained()->restrictOnDelete();
            $table->foreignId('submission_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('sort_order');
            $table->timestamps();

            $table->unique(['assessment_id', 'task_version_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_submissions');
        Schema::dropIfExists('assessment_tasks');
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropForeign(['assessment_id']);
        });
        Schema::dropIfExists('assessments');
    }
};
