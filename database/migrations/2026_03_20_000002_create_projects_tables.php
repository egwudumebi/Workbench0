<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->longText('instructions')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('current_version_id')->nullable();
            $table->timestamps();

            $table->index('status');
        });

        Schema::create('project_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('changelog')->nullable();
            $table->boolean('is_current')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'version_number']);
            $table->index(['project_id', 'is_current']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->foreign('current_version_id')
                ->references('id')
                ->on('project_versions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['current_version_id']);
        });

        Schema::dropIfExists('project_versions');
        Schema::dropIfExists('projects');
    }
};
