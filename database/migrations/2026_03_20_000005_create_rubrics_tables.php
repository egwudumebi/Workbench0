<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rubrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->foreignId('current_version_id')->nullable();
            $table->timestamps();
        });

        Schema::create('rubric_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rubric_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_version_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('name');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['rubric_id', 'version_number']);
        });

        Schema::table('rubrics', function (Blueprint $table) {
            $table->foreign('current_version_id')
                ->references('id')
                ->on('rubric_versions')
                ->nullOnDelete();
        });

        Schema::create('rubric_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rubric_version_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('weight')->default(25);
            $table->boolean('critical')->default(false);
            $table->json('evaluation_rules')->nullable();
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('rubrics', function (Blueprint $table) {
            $table->dropForeign(['current_version_id']);
        });

        Schema::dropIfExists('rubric_criteria');
        Schema::dropIfExists('rubric_versions');
        Schema::dropIfExists('rubrics');
    }
};
