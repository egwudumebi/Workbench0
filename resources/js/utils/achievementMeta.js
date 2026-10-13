const ACHIEVEMENT_ICONS = {
    'first-lesson': '📖',
    'rubric-explorer': '🧭',
    'accuracy-apprentice': '🎯',
    'response-duel-champion': '⚔️',
    'consistency-builder': '💎',
    'independent-evaluator': '🎓',
    'assessment-ready': '🏁',
};

export function achievementIcon(slug) {
    return ACHIEVEMENT_ICONS[slug] ?? '🏅';
}

export function achievementProgressPercent(achievement) {
    if (achievement.earned_at) return 100;
    const target = achievement.criteria_value ?? 1;
    const current = achievement.progress_value ?? 0;
    return Math.min(100, Math.round((current / target) * 100));
}

export function achievementProgressLabel(achievement) {
    if (achievement.earned_at) return 'Unlocked';
    const target = achievement.criteria_value ?? 1;
    const current = achievement.progress_value ?? 0;
    return `${Math.min(current, target)} / ${target}`;
}
