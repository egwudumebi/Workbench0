<?php

namespace App\Support;

class TaskTypeSchema
{
    /**
     * @param  array<string, mixed>  $schema
     * @return array<string, mixed>
     */
    public static function withDisplay(array $schema, string $slug): array
    {
        $defaults = config("workbench.task_type_displays.{$slug}", []);

        if ($defaults === []) {
            return $schema;
        }

        $schema['display'] = array_replace_recursive(
            $defaults,
            $schema['display'] ?? [],
        );

        return $schema;
    }
}
