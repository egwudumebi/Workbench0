<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Academy\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LearnerProfileController extends Controller
{
    public function __construct(private readonly GamificationService $gamificationService) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $this->gamificationService->profile($user);

        return response()->json([
            'data' => [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'profile' => [
                    'xp' => $profile->xp,
                    'level' => $profile->level,
                    'level_xp_floor' => $this->gamificationService->levelXpFloor($profile->level),
                    'level_xp_ceiling' => $this->gamificationService->levelXpCeiling($profile->level),
                    'xp_to_next_level' => $this->gamificationService->xpToNextLevel($profile->xp),
                    'streak_days' => $profile->streak_days,
                    'preferences' => $profile->preferences ?? [],
                ],
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'preferences' => ['required', 'array'],
            'preferences.daily_reminder' => ['sometimes', 'boolean'],
            'preferences.preferred_program_id' => ['sometimes', 'nullable', 'integer'],
            'preferences.display_name' => ['sometimes', 'nullable', 'string', 'max:120'],
        ]);

        $profile = $this->gamificationService->profile($request->user());
        $profile->update([
            'preferences' => array_merge($profile->preferences ?? [], $validated['preferences']),
        ]);

        return response()->json(['data' => $profile->fresh()]);
    }
}
