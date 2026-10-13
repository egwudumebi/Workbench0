<?php

namespace App\Services\Academy;

use App\Contracts\Academy\CurriculumGenerationProvider;
use App\Contracts\Academy\GuidelineAnalysisProvider;
use App\Enums\AcademyStatus;
use App\Models\Academy;
use App\Models\AcademyGeneration;
use App\Models\CurriculumVersion;
use App\Models\ExtractedRule;
use App\Models\GuidelineDocument;
use App\Models\SourceReference;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BuildAcademyService
{
    public function __construct(
        private readonly GuidelineTextExtractor $textExtractor,
        private readonly GuidelineAnalysisProvider $analysisProvider,
        private readonly CurriculumGenerationProvider $curriculumProvider,
    ) {}

    public function createAcademy(User $user, array $data): Academy
    {
        return Academy::query()->create([
            'user_id' => $user->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'target_platform' => $data['target_platform'] ?? null,
            'experience_level' => $data['experience_level'] ?? null,
            'learning_goals' => $data['learning_goals'] ?? [],
            'status' => AcademyStatus::Draft,
            'authorized_upload' => (bool) ($data['authorized_upload'] ?? false),
        ]);
    }

    public function storeDocument(Academy $academy, User $user, UploadedFile $file): GuidelineDocument
    {
        abort_unless($academy->user_id === $user->id, 403);
        abort_unless($academy->authorized_upload, 422, 'You must confirm authorisation to upload this document.');

        $extract = $this->textExtractor->extract($file);
        $disk = config('workbench.academy.guidelines.storage_disk', 'local');
        $path = $file->store('guidelines/'.$user->id, $disk);

        return GuidelineDocument::query()->create([
            'academy_id' => $academy->id,
            'user_id' => $user->id,
            'original_filename' => $file->getClientOriginalName(),
            'disk_path' => $path,
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $file->getSize(),
            'extracted_text' => $extract['text'],
            'ocr_required' => $extract['ocr_required'],
            'extraction_failed' => $extract['failed'],
            'uploaded_at' => now(),
        ]);
    }

    public function generate(Academy $academy, GuidelineDocument $document): AcademyGeneration
    {
        abort_unless($academy->user_id === $document->user_id, 403);

        $generation = AcademyGeneration::query()->create([
            'academy_id' => $academy->id,
            'guideline_document_id' => $document->id,
            'status' => 'processing',
            'provider' => config('workbench.academy.generation.default_provider', 'local'),
        ]);

        $academy->update(['status' => AcademyStatus::Generating]);

        return DB::transaction(function () use ($academy, $document, $generation) {
            try {
                $analysis = $this->analysisProvider->analyze($document);

                foreach ($analysis['rules'] as $rule) {
                    ExtractedRule::query()->create([
                        'guideline_document_id' => $document->id,
                        'rule_key' => $rule['key'],
                        'rule_text' => $rule['text'],
                        'section_ref' => $rule['section_ref'],
                        'category' => $rule['category'],
                        'importance' => $rule['importance'],
                        'review_status' => $rule['review_status'],
                        'confidence' => $rule['confidence'],
                    ]);
                }

                $curriculum = $this->curriculumProvider->generate($academy, $document, $analysis);

                $versionNumber = (int) $academy->curriculumVersions()->max('version_number') + 1;

                $version = CurriculumVersion::query()->create([
                    'academy_id' => $academy->id,
                    'version_number' => $versionNumber,
                    'structure' => $curriculum,
                    'ambiguities' => $curriculum['ambiguities'] ?? [],
                ]);

                foreach ($curriculum['lessons'] as $lesson) {
                    if (! isset($lesson['source_reference'])) {
                        continue;
                    }

                    SourceReference::query()->create([
                        'referable_type' => CurriculumVersion::class,
                        'referable_id' => $version->id,
                        'guideline_document_id' => $document->id,
                        'section_ref' => $lesson['source_reference']['section_ref'] ?? null,
                        'excerpt' => $lesson['source_reference']['excerpt'] ?? null,
                    ]);
                }

                $generation->update(['status' => 'completed', 'completed_at' => now()]);
                $academy->update(['status' => AcademyStatus::Review]);

                return $generation->fresh();
            } catch (\Throwable $e) {
                $generation->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'completed_at' => now(),
                ]);
                $academy->update(['status' => AcademyStatus::Draft]);

                throw $e;
            }
        });
    }

    public function publish(Academy $academy, User $user): Academy
    {
        abort_unless($academy->user_id === $user->id, 403);

        $version = $academy->curriculumVersions()->latest('version_number')->first();
        abort_unless($version, 422, 'Generate a curriculum before publishing.');

        $academy->update([
            'published_curriculum_version_id' => $version->id,
            'status' => AcademyStatus::Published,
        ]);

        $version->update(['published_at' => now()]);

        return $academy->fresh(['publishedCurriculum']);
    }

    public function downloadDocument(GuidelineDocument $document, User $user): string
    {
        abort_unless($document->user_id === $user->id, 403);
        $disk = config('workbench.academy.guidelines.storage_disk', 'local');

        return Storage::disk($disk)->path($document->disk_path);
    }
}
