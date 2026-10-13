<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\TrainingProgram;
use App\Services\Admin\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTrainingProgramController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(): JsonResponse
    {
        $programs = TrainingProgram::query()
            ->with('project:id,name,slug')
            ->withCount(['modules', 'lessons', 'enrolments'])
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $programs]);
    }

    public function show(TrainingProgram $trainingProgram): JsonResponse
    {
        $trainingProgram->load(['modules.lessons', 'project']);

        return response()->json(['data' => $trainingProgram]);
    }

    public function update(Request $request, TrainingProgram $trainingProgram): JsonResponse
    {
        $before = $trainingProgram->toArray();
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'status' => ['sometimes', 'in:published,draft,archived'],
            'featured' => ['sometimes', 'boolean'],
            'last_reviewed_at' => ['sometimes', 'date'],
        ]);

        $trainingProgram->update($validated);
        $this->auditLogService->log($request->user(), 'training_program_updated', $trainingProgram, $before, $trainingProgram->fresh()->toArray());

        return response()->json(['data' => $trainingProgram->fresh(['modules'])]);
    }
}
