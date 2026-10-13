<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_type_id')->constrained()->restrictOnDelete();
            $table->string('slug');
            $table->string('title');
            $table->foreignId('current_version_id')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['project_id', 'slug']);
        });

        Schema::create('task_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_version_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('title');
            $table->longText('prompt');
            $table->json('context')->nullable();
            $table->longText('response_a')->nullable();
            $table->longText('response_b')->nullable();
            $table->json('configuration')->nullable();
            $table->json('expected_output');
            $table->unsignedTinyInteger('difficulty')->default(1);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['task_id', 'version_number']);
            $table->index(['project_version_id', 'difficulty', 'active']);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->foreign('current_version_id')
                ->references('id')
                ->on('task_versions')
                ->nullOnDelete();
        });

        Schema::create('task_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('weight')->default(1);
            $table->timestamps();

            $table->unique(['task_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['current_version_id']);
        });

        Schema::dropIfExists('task_skills');
        Schema::dropIfExists('task_versions');
        Schema::dropIfExists('tasks');
    }
};
