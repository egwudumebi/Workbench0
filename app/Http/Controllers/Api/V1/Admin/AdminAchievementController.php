<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\UserAchievement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAchievementController extends Controller
{
    public function index(): JsonResponse
    {
        $achievements = Achievement::query()->orderBy('name')->get();

        $earnedCounts = UserAchievement::query()
            ->selectRaw('achievement_id, count(*) as earned_count')
            ->groupBy('achievement_id')
            ->pluck('earned_count', 'achievement_id');

        return response()->json([
            'data' => $achievements->map(fn (Achievement $a) => [
                'id' => $a->id,
                'slug' => $a->slug,
                'name' => $a->name,
                'description' => $a->description,
                'icon' => $a->icon,
                'criteria_type' => $a->criteria_type,
                'criteria_value' => $a->criteria_value,
                'xp_reward' => $a->xp_reward,
                'earned_count' => (int) ($earnedCounts[$a->id] ?? 0),
            ]),
        ]);
    }

    public function update(Request $request, Achievement $achievement): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'xp_reward' => ['sometimes', 'integer', 'min:0', 'max:1000'],
            'criteria_value' => ['sometimes', 'integer', 'min:1'],
        ]);

        $achievement->update($validated);

        return response()->json(['data' => $achievement->fresh()]);
    }
}
