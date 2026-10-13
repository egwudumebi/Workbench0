<?php

/**
 * Default UI/display config merged into each task type schema by slug.
 * Projects inherit these when cloned from the AI Response Evaluation template.
 */
return [
    'binary_evaluation' => [
        'panels' => [
            'context' => true,
            'images' => true,
            'prompt' => true,
            'response_a' => true,
            'response_b' => 'when_present',
        ],
        'labels' => [
            'prompt' => 'Prompt',
            'response_a' => 'AI Response',
            'response_b' => 'AI Response B',
            'context' => 'Context',
        ],
        'form' => [
            'decision_field' => 'decision',
            'explanation_field' => 'explanation',
            'decision_style' => 'radio',
            'decision_label' => 'Your Rating',
        ],
    ],
    'multi_class_rating' => [
        'panels' => [
            'context' => true,
            'images' => true,
            'prompt' => true,
            'response_a' => true,
            'response_b' => 'when_present',
        ],
        'labels' => [
            'prompt' => 'Prompt',
            'response_a' => 'AI Response',
            'response_b' => 'AI Response B',
        ],
        'form' => [
            'decision_field' => 'decision',
            'explanation_field' => 'explanation',
            'decision_style' => 'radio',
            'decision_label' => 'Quality Rating',
        ],
    ],
    'pairwise_comparison' => [
        'panels' => [
            'context' => true,
            'images' => true,
            'prompt' => true,
            'response_a' => true,
            'response_b' => true,
        ],
        'labels' => [
            'prompt' => 'Prompt',
            'response_a' => 'Response A',
            'response_b' => 'Response B',
        ],
        'form' => [
            'decision_field' => 'decision',
            'explanation_field' => 'explanation',
            'decision_style' => 'radio',
            'decision_label' => 'Preferred Response',
        ],
    ],
    'combined_evaluation' => [
        'panels' => [
            'context' => true,
            'images' => true,
            'prompt' => true,
            'response_a' => true,
            'response_b' => 'when_present',
        ],
        'labels' => [
            'prompt' => 'Prompt',
            'response_a' => 'AI Response',
            'response_b' => 'AI Response B',
        ],
        'form' => [
            'decision_field' => 'decision',
            'explanation_field' => 'explanation',
            'decision_style' => 'radio',
            'decision_label' => 'Rating',
        ],
    ],
];
