<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Academy;
use App\Models\GuidelineDocument;
use App\Services\Academy\BuildAcademyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademyLearnerController extends Controller
{
    public function __construct(private readonly BuildAcademyService $buildAcademyService) {}

    public function index(Request $request): JsonResponse
    {
        $academies = Academy::query()
            ->where('user_id', $request->user()->id)
            ->with(['publishedCurriculum'])
            ->latest()
            ->get();

        return response()->json(['data' => $academies]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'target_platform' => ['nullable', 'string', 'max:255'],
            'experience_level' => ['nullable', 'string', 'max:64'],
            'learning_goals' => ['nullable', 'array'],
            'authorized_upload' => ['accepted'],
        ]);

        $academy = $this->buildAcademyService->createAcademy($request->user(), $validated);

        return response()->json(['data' => $academy], 201);
    }

    public function show(Request $request, Academy $academy): JsonResponse
    {
        abort_unless($academy->user_id === $request->user()->id, 404);

        $academy->load(['documents' => fn ($q) => $q->with('rules'), 'curriculumVersions', 'publishedCurriculum', 'generations']);

        return response()->json(['data' => $academy]);
    }

    public function uploadDocument(Request $request, Academy $academy): JsonResponse
    {
        abort_unless($academy->user_id === $request->user()->id, 404);

        $maxKb = config('workbench.academy.guidelines.max_upload_kb', 10240);

        $request->validate([
            'document' => ['required', 'file', 'max:'.$maxKb, 'mimes:pdf,txt,docx'],
            'authorized_upload' => ['accepted'],
        ]);

        $academy->update(['authorized_upload' => true]);

        $document = $this->buildAcademyService->storeDocument(
            $academy,
            $request->user(),
            $request->file('document')
        );

        return response()->json(['data' => $document], 201);
    }

    public function generate(Request $request, Academy $academy): JsonResponse
    {
        abort_unless($academy->user_id === $request->user()->id, 404);

        $document = GuidelineDocument::query()
            ->where('academy_id', $academy->id)
            ->where('user_id', $request->user()->id)
            ->latest()
            ->firstOrFail();

        if ($document->extraction_failed && $document->ocr_required) {
            return response()->json([
                'message' => 'Text extraction failed. This document may require OCR before generation.',
            ], 422);
        }

        $generation = $this->buildAcademyService->generate($academy, $document);

        return response()->json(['data' => $academy->fresh(['curriculumVersions', 'documents'])], 202);
    }

    public function publish(Request $request, Academy $academy): JsonResponse
    {
        abort_unless($academy->user_id === $request->user()->id, 404);

        $academy = $this->buildAcademyService->publish($academy, $request->user());

        return response()->json(['data' => $academy]);
    }

    public function curriculum(Request $request, Academy $academy): JsonResponse
    {
        abort_unless($academy->user_id === $request->user()->id, 404);
        abort_unless($academy->published_curriculum_version_id, 404, 'Academy is not published yet.');

        $academy->load(['publishedCurriculum', 'documents.rules']);

        return response()->json([
            'data' => [
                'academy' => $academy->only(['id', 'title', 'description', 'status']),
                'curriculum' => $academy->publishedCurriculum,
                'source_rules' => $academy->documents->flatMap->rules,
            ],
        ]);
    }
}
