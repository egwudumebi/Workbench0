<?php

namespace App\Providers;

use App\Services\Evaluation\EvaluationEngineInterface;
use App\Services\Evaluation\LocalEvaluationEngine;
use Illuminate\Support\ServiceProvider;

class EvaluationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(EvaluationEngineInterface::class, function () {
            $driver = config('workbench.evaluation.driver', 'local');

            return match ($driver) {
                'local' => new LocalEvaluationEngine,
                default => new LocalEvaluationEngine,
            };
        });
    }
}
