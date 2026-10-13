<?php

namespace App\Providers;

use App\Contracts\Academy\CurriculumGenerationProvider;
use App\Contracts\Academy\GuidelineAnalysisProvider;
use App\Services\Academy\LocalCurriculumGenerationProvider;
use App\Services\Academy\LocalGuidelineAnalysisProvider;
use Illuminate\Support\ServiceProvider;

class AcademyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(GuidelineAnalysisProvider::class, function () {
            $provider = config('workbench.academy.generation.default_provider', 'local');

            return match ($provider) {
                default => $this->app->make(LocalGuidelineAnalysisProvider::class),
            };
        });

        $this->app->bind(CurriculumGenerationProvider::class, function () {
            $provider = config('workbench.academy.generation.default_provider', 'local');

            return match ($provider) {
                default => $this->app->make(LocalCurriculumGenerationProvider::class),
            };
        });
    }
}
