<?php

namespace App\DTOs\Evaluation;

use App\Enums\MistakeSeverity;

readonly class MistakeResult
{
    public function __construct(
        public string $category,
        public MistakeSeverity $severity,
        public string $description,
    ) {}

    public function toArray(): array
    {
        return [
            'category' => $this->category,
            'severity' => $this->severity->value,
            'description' => $this->description,
        ];
    }
}
