<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\IntegrityAcknowledgement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrityController extends Controller
{
    public function assessmentRules(): JsonResponse
    {
        return response()->json([
            'data' => array_merge(
                ['rules_version' => config('workbench.integrity.rules_version')],
                config('workbench.integrity.assessment', []),
            ),
        ]);
    }

    public function acknowledgeAssessment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'acknowledged' => ['accepted'],
            'training_program_id' => ['nullable', 'integer', 'exists:training_programs,id'],
        ]);

        $ack = IntegrityAcknowledgement::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'context' => 'assessment',
                'rules_version' => config('workbench.integrity.rules_version'),
            ],
            [
                'training_program_id' => $validated['training_program_id'] ?? null,
                'acknowledged_at' => now(),
            ]
        );

        return response()->json(['data' => $ack]);
    }

    public function assessmentStatus(Request $request): JsonResponse
    {
        $ack = IntegrityAcknowledgement::query()
            ->where('user_id', $request->user()->id)
            ->where('context', 'assessment')
            ->where('rules_version', config('workbench.integrity.rules_version'))
            ->first();

        return response()->json([
            'data' => [
                'acknowledged' => (bool) $ack,
                'acknowledged_at' => $ack?->acknowledged_at,
            ],
        ]);
    }
}
