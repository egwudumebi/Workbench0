<?php

namespace App\DTOs\Evaluation;

readonly class FeedbackResult
{
    public function __construct(
        public string $summary,
        public string $whatWentWell,
        public string $whatWasMissed,
        public string $whyItMatters,
        public string $howToImprove,
    ) {}

    public function toArray(): array
    {
        return [
            'summary' => $this->summary,
            'what_went_well' => $this->whatWentWell,
            'what_was_missed' => $this->whatWasMissed,
            'why_it_matters' => $this->whyItMatters,
            'how_to_improve' => $this->howToImprove,
        ];
    }
}
