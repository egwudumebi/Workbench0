<?php

return [

    'allow_registration' => env('WORKBENCH_ALLOW_REGISTRATION', true),

    'evaluation' => [
        'driver' => env('AI_EVALUATION_DRIVER', 'local'),
        'engine_version' => env('AI_EVALUATION_ENGINE_VERSION', '1.0.0'),
        'rules_version' => env('AI_EVALUATION_RULES_VERSION', '1.0.0'),
    ],

    'readiness' => [
        'overall_threshold' => (int) env('WORKBENCH_READINESS_OVERALL', 85),
        'critical_skill_threshold' => (int) env('WORKBENCH_READINESS_CRITICAL_SKILL', 75),
        'minimum_assessments' => (int) env('WORKBENCH_READINESS_MIN_ASSESSMENTS', 2),
        'assessment_pass_threshold' => (int) env('WORKBENCH_ASSESSMENT_PASS', 80),
        'consistency_window' => (int) env('WORKBENCH_READINESS_CONSISTENCY_WINDOW', 2),
    ],

    'training' => [
        'weak_skill_threshold' => (int) env('WORKBENCH_WEAK_SKILL_THRESHOLD', 70),
        'strong_skill_threshold' => (int) env('WORKBENCH_STRONG_SKILL_THRESHOLD', 90),
        'mistake_recurrence_threshold' => (int) env('WORKBENCH_MISTAKE_RECURRENCE', 3),
        'recent_attempts_weight' => (float) env('WORKBENCH_RECENT_WEIGHT', 0.6),
    ],

    'assessment' => [
        'default_task_count' => (int) env('WORKBENCH_ASSESSMENT_TASK_COUNT', 20),
        'default_time_limit_minutes' => (int) env('WORKBENCH_ASSESSMENT_TIME_LIMIT', 45),
    ],

    'pagination' => [
        'default' => (int) env('WORKBENCH_PAGINATION_DEFAULT', 15),
        'admin' => (int) env('WORKBENCH_PAGINATION_ADMIN', 25),
    ],

];
