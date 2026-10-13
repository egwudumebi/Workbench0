<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PracticeAttempt;
use App\Models\PracticeChallenge;
use App\Services\Academy\GamificationService;
use App\Services\Academy\PracticeChallengeScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PracticeArenaController extends Controller
{
    public function __construct(
        private readonly PracticeChallengeScoringService $scoringService,
        private readonly GamificationService $gamificationService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = PracticeChallenge::query()->where('active', true);

        if ($request->filled('program_id')) {
            $query->where('training_program_id', $request->integer('program_id'));
        }

        if ($request->filled('mode')) {
            $query->where('mode', $request->string('mode'));
        }

        if ($request->boolean('daily')) {
            $query->where('is_daily', true);
        }

        $challenges = $query->orderBy('title')->get()->map(fn (PracticeChallenge $c) => [
            'id' => $c->id,
            'slug' => $c->slug,
            'mode' => $c->mode->value,
            'mode_label' => $c->mode->label(),
            'title' => $c->title,
            'instructions' => $c->instructions,
            'difficulty' => $c->difficulty,
            'content' => $c->content,
            'skill_slugs' => $c->skill_slugs,
            'is_daily' => $c->is_daily,
        ]);

        return response()->json(['data' => $challenges]);
    }

    public function show(PracticeChallenge $challenge): JsonResponse
    {
        abort_unless($challenge->active, 404);

        return response()->json([
            'data' => [
                'id' => $challenge->id,
                'slug' => $challenge->slug,
                'mode' => $challenge->mode->value,
                'mode_label' => $challenge->mode->label(),
                'title' => $challenge->title,
                'instructions' => $challenge->instructions,
                'difficulty' => $challenge->difficulty,
                'content' => $challenge->content,
                'skill_slugs' => $challenge->skill_slugs,
            ],
        ]);
    }

    public function submit(Request $request, PracticeChallenge $challenge): JsonResponse
    {
        abort_unless($challenge->active, 404);

        $validated = $request->validate([
            'submission' => ['required', 'array'],
        ]);

        $result = $this->scoringService->score($challenge, $validated['submission']);

        $attempt = PracticeAttempt::query()->create([
            'user_id' => $request->user()->id,
            'practice_challenge_id' => $challenge->id,
            'submission' => $validated['submission'],
            'score_percent' => $result['score_percent'],
            'feedback' => $result['feedback'],
            'passed' => $result['passed'],
        ]);

        if ($result['passed']) {
            $this->gamificationService->recordLearningActivity($request->user());
            $this->gamificationService->awardXp(
                $request->user(),
                'practice_pass',
                'practice_challenge',
                $challenge->id
            );
        }

        return response()->json(['data' => ['attempt' => $attempt, 'result' => $result]]);
    }
}
