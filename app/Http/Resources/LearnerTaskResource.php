<?php

namespace App\Http\Resources;

use App\Support\TaskTypeSchema;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TaskVersion */
class LearnerTaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $task = $this->task;
        $taskType = $task?->taskType;

        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'title' => $this->title,
            'prompt' => $this->prompt,
            'context' => $this->context,
            'images' => $this->normalizeImages(),
            'response_a' => $this->response_a,
            'response_b' => $this->response_b,
            'configuration' => $this->configuration,
            'difficulty' => $this->difficulty->value,
            'difficulty_label' => $this->difficulty->label(),
            'task_type' => $taskType ? [
                'slug' => $taskType->slug,
                'name' => $taskType->name,
                'schema' => TaskTypeSchema::withDisplay($taskType->schema ?? [], $taskType->slug),
            ] : null,
        ];
    }

    /**
     * @return array<int, array{url: string, alt: string, caption: string|null}>
     */
    private function normalizeImages(): array
    {
        $images = [];

        foreach ([$this->context, $this->configuration] as $source) {
            if (! is_array($source)) {
                continue;
            }

            foreach (['images', 'attachments', 'media'] as $key) {
                if (! empty($source[$key]) && is_array($source[$key])) {
                    $images = array_merge($images, $source[$key]);
                }
            }
        }

        return collect($images)
            ->map(function ($item, $index) {
                if (is_string($item)) {
                    return [
                        'url' => $item,
                        'alt' => 'Reference image '.($index + 1),
                        'caption' => null,
                    ];
                }

                if (! is_array($item) || empty($item['url'])) {
                    return null;
                }

                return [
                    'url' => $item['url'],
                    'alt' => $item['alt'] ?? $item['title'] ?? 'Reference image '.($index + 1),
                    'caption' => $item['caption'] ?? $item['description'] ?? null,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }
}
