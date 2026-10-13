<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PracticeChallengeMode;
use App\Http\Controllers\Controller;
use App\Models\PracticeChallenge;
use App\Services\Admin\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminPracticeChallengeController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request): JsonResponse
    {
        $query = PracticeChallenge::query()
            ->with('program:id,name,slug')
            ->orderByDesc('is_daily')
            ->orderBy('title');

        if ($request->filled('mode')) {
            $query->where('mode', $request->string('mode'));
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $challenges = $query->paginate(config('workbench.pagination.admin', 25));

        return response()->json([
            'data' => collect($challenges->items())->map(fn (PracticeChallenge $c) => $this->serialize($c)),
            'meta' => [
                'current_page' => $challenges->currentPage(),
                'last_page' => $challenges->lastPage(),
                'total' => $challenges->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);

        if ($validated['is_daily'] ?? false) {
            $this->clearOtherDailyFlags();
        }

        $challenge = PracticeChallenge::query()->create($validated);

        $this->auditLogService->log($request->user(), 'practice_challenge_created', $challenge, null, $challenge->toArray());

        return response()->json(['data' => $this->serialize($challenge->load('program:id,name,slug'))], 201);
    }

    public function update(Request $request, PracticeChallenge $practiceChallenge): JsonResponse
    {
        $before = $practiceChallenge->toArray();
        $validated = $this->validatePayload($request, $practiceChallenge, partial: true);

        if (! empty($validated['is_daily'])) {
            $this->clearOtherDailyFlags($practiceChallenge->id);
        }

        $practiceChallenge->update($validated);

        $this->auditLogService->log(
            $request->user(),
            'practice_challenge_updated',
            $practiceChallenge,
            $before,
            $practiceChallenge->fresh()->toArray(),
        );

        return response()->json(['data' => $this->serialize($practiceChallenge->fresh()->load('program:id,name,slug'))]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?PracticeChallenge $existing = null, bool $partial = false): array
    {
        $modeValues = array_map(
            fn (PracticeChallengeMode $m) => $m->value,
            array_filter(
                PracticeChallengeMode::cases(),
                fn (PracticeChallengeMode $m) => $m !== PracticeChallengeMode::Daily,
            ),
        );

        $required = $partial ? 'sometimes' : 'required';

        $validated = $request->validate([
            'training_program_id' => ['sometimes', 'nullable', 'integer', 'exists:training_programs,id'],
            'project_id' => ['sometimes', 'nullable', 'integer', 'exists:projects,id'],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:120',
                Rule::unique('practice_challenges', 'slug')->ignore($existing?->id),
            ],
            'mode' => [$required, Rule::in($modeValues)],
            'title' => [$required, 'string', 'max:255'],
            'instructions' => ['sometimes', 'nullable', 'string'],
            'difficulty' => [$required, 'integer', 'between:1,5'],
            'content' => [$required, 'array'],
            'answer_key' => [$required, 'array'],
            'skill_slugs' => ['sometimes', 'nullable', 'array'],
            'skill_slugs.*' => ['string', 'max:80'],
            'active' => ['sometimes', 'boolean'],
            'is_daily' => ['sometimes', 'boolean'],
        ]);

        if (! $partial && empty($validated['slug'] ?? null)) {
            $validated['slug'] = Str::slug($validated['title']).'-'.Str::random(4);
        }

        if (! $partial) {
            $validated['active'] = $validated['active'] ?? true;
            $validated['is_daily'] = $validated['is_daily'] ?? false;
        }

        return $validated;
    }

    private function clearOtherDailyFlags(?int $exceptId = null): void
    {
        PracticeChallenge::query()
            ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->where('is_daily', true)
            ->update(['is_daily' => false]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(PracticeChallenge $c): array
    {
        return [
            'id' => $c->id,
            'slug' => $c->slug,
            'mode' => $c->mode->value,
            'mode_label' => $c->mode->label(),
            'title' => $c->title,
            'instructions' => $c->instructions,
            'difficulty' => $c->difficulty,
            'content' => $c->content,
            'answer_key' => $c->answer_key,
            'skill_slugs' => $c->skill_slugs ?? [],
            'active' => $c->active,
            'is_daily' => $c->is_daily,
            'training_program_id' => $c->training_program_id,
            'project_id' => $c->project_id,
            'program' => $c->program ? [
                'id' => $c->program->id,
                'name' => $c->program->name,
                'slug' => $c->program->slug,
            ] : null,
            'updated_at' => $c->updated_at?->toIso8601String(),
        ];
    }
}
