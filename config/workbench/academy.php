<?php

return [
    'guidelines' => [
        'max_upload_kb' => (int) env('WORKBENCH_GUIDELINE_MAX_KB', 10240),
        'allowed_mimes' => ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'allowed_extensions' => ['pdf', 'txt', 'docx'],
        'storage_disk' => env('WORKBENCH_GUIDELINE_DISK', 'local'),
    ],

    'generation' => [
        'default_provider' => env('WORKBENCH_ACADEMY_PROVIDER', 'local'),
        'ai_provider' => env('WORKBENCH_ACADEMY_AI_PROVIDER', 'openai'),
    ],

    'xp' => [
        'lesson_complete' => 50,
        'checkpoint_correct' => 15,
        'quiz_pass' => 40,
        'practice_pass' => 35,
        'assessment_pass' => 100,
        'achievement' => 25,
    ],

    'levels' => [
        1 => 0,
        2 => 200,
        3 => 500,
        4 => 900,
        5 => 1400,
        6 => 2000,
        7 => 2700,
        8 => 3500,
    ],
];
