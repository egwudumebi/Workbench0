<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_audit_logs_with_entity_fields(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();

        AuditLog::query()->create([
            'user_id' => $admin->id,
            'action' => 'practice_challenge_updated',
            'entity_type' => 'App\\Models\\PracticeChallenge',
            'entity_id' => 42,
            'before' => ['title' => 'Old title'],
            'after' => ['title' => 'New title'],
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs')
            ->assertOk()
            ->assertJsonPath('data.0.entity_type', 'App\\Models\\PracticeChallenge')
            ->assertJsonPath('data.0.entity_id', 42)
            ->assertJsonPath('data.0.after.title', 'New title')
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'total']]);
    }

    public function test_audit_log_search_filters_by_action(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@workbench0.local')->firstOrFail();

        AuditLog::query()->create([
            'user_id' => $admin->id,
            'action' => 'lesson_deleted',
            'entity_type' => 'App\\Models\\Lesson',
            'entity_id' => 1,
            'before' => ['title' => 'Intro'],
            'after' => null,
        ]);

        AuditLog::query()->create([
            'user_id' => $admin->id,
            'action' => 'task_created',
            'entity_type' => 'App\\Models\\Task',
            'entity_id' => 2,
            'before' => null,
            'after' => ['title' => 'Sample'],
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs?action_filter=deleted')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.action', 'lesson_deleted');
    }
}
