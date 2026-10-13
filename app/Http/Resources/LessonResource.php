<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Lesson */
class LessonResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->content,
            'sort_order' => $this->sort_order,
            'status' => $this->status->value,
            'examples' => $this->whenLoaded('examples', fn () => $this->examples->map(fn ($e) => [
                'id' => $e->id,
                'title' => $e->title,
                'content' => $e->content,
            ])),
        ];
    }
}
