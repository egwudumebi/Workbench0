<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use App\Models\TrainingProgram;
use App\Services\Admin\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminTrainingModuleController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function store(Request $request, TrainingProgram $trainingProgram): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $sortOrder = $validated['sort_order']
            ?? ((int) $trainingProgram->modules()->max('sort_order')) + 1;

        $module = TrainingModule::query()->create([
            'training_program_id' => $trainingProgram->id,
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']).'-'.Str::random(4),
            'description' => $validated['description'] ?? null,
            'sort_order' => $sortOrder,
        ]);

        $this->auditLogService->log($request->user(), 'training_module_created', $module, null, $module->toArray());

        return response()->json(['data' => $module], 201);
    }

    public function update(Request $request, TrainingModule $trainingModule): JsonResponse
    {
        $before = $trainingModule->toArray();
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $trainingModule->update($validated);
        $this->auditLogService->log($request->user(), 'training_module_updated', $trainingModule, $before, $trainingModule->fresh()->toArray());

        return response()->json(['data' => $trainingModule->fresh()]);
    }

    public function destroy(Request $request, TrainingModule $trainingModule): JsonResponse
    {
        $before = $trainingModule->toArray();
        $trainingModule->delete();
        $this->auditLogService->log($request->user(), 'training_module_deleted', $trainingModule, $before, null);

        return response()->json(['data' => ['deleted' => true]]);
    }
}
