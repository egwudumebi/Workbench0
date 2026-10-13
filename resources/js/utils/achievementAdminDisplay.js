const BADGE_VISUALS = {
    'first-lesson': { emoji: '📘', tone: 'sky' },
    'rubric-explorer': { emoji: '🧭', tone: 'violet' },
    'accuracy-apprentice': { emoji: '🎯', tone: 'teal' },
    'response-duel-champion': { emoji: '⚔️', tone: 'rose' },
    'consistency-builder': { emoji: '🔥', tone: 'amber' },
    'independent-evaluator': { emoji: '🎓', tone: 'gold' },
    'assessment-ready': { emoji: '🏆', tone: 'gold' },
};

const CRITERIA_TONE = {
    lessons_completed: 'violet',
    practice_passed: 'rose',
    assessments_passed: 'gold',
    level_reached: 'sky',
    xp_total: 'amber',
};

export function achievementBadgeVisual(slug) {
    return BADGE_VISUALS[slug] ?? { emoji: '🏅', tone: 'slate' };
}

export function achievementCriteriaTone(criteriaType) {
    return CRITERIA_TONE[criteriaType] ?? 'slate';
}

export function formatAchievementCriteria(criteriaType, criteriaValue) {
    const v = Number(criteriaValue);
    switch (criteriaType) {
        case 'lessons_completed':
            return `Complete ${v} lesson${v === 1 ? '' : 's'}`;
        case 'practice_passed':
            return `Pass ${v} practice run${v === 1 ? '' : 's'}`;
        case 'assessments_passed':
            return `Pass ${v} assessment${v === 1 ? '' : 's'}`;
        case 'level_reached':
            return `Reach level ${v}`;
        case 'xp_total':
            return `Earn ${v.toLocaleString()} XP total`;
        default:
            return `${criteriaType?.replace(/_/g, ' ') ?? 'Criteria'} ≥ ${v}`;
    }
}

export function achievementCriteriaCategory(criteriaType) {
    switch (criteriaType) {
        case 'lessons_completed':
            return 'Academy';
        case 'practice_passed':
            return 'Practice';
        case 'assessments_passed':
            return 'Assessment';
        case 'level_reached':
        case 'xp_total':
            return 'Progression';
        default:
            return 'Other';
    }
}
