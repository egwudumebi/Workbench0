<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ProjectStatus;
use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AuditLog;
use App\Models\PracticeChallenge;
use App\Models\ProgramEnrolment;
use App\Models\Project;
use App\Models\Submission;
use App\Models\Task;
use App\Models\TrainingProgram;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $recentAudit = AuditLog::query()
            ->with('user:id,name,email')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'entity_type' => $log->entity_type,
                'entity_id' => $log->entity_id,
                'created_at' => $log->created_at?->toIso8601String(),
                'user' => $log->user ? [
                    'name' => $log->user->name,
                    'email' => $log->user->email,
                ] : null,
            ]);

        return response()->json([
            'data' => [
                'counts' => [
                    'learners' => User::query()->where('role', 'learner')->count(),
                    'admins' => User::query()->where('role', 'admin')->count(),
                    'projects_total' => Project::query()->count(),
                    'projects_active' => Project::query()->where('status', ProjectStatus::Active)->count(),
                    'training_programs' => TrainingProgram::query()->count(),
                    'training_programs_published' => TrainingProgram::query()->where('status', 'published')->count(),
                    'tasks' => Task::query()->count(),
                    'practice_challenges' => PracticeChallenge::query()->where('active', true)->count(),
                    'enrolments' => ProgramEnrolment::query()->count(),
                    'submissions' => Submission::query()->count(),
                    'assessments_completed' => Assessment::query()->where('status', 'completed')->count(),
                ],
                'recent_audit' => $recentAudit,
            ],
        ]);
    }
}
