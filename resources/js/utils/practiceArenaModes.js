/** Matches config/workbench/academy.php practice_pass XP */
export const PRACTICE_PASS_XP = 35;

export const MODE_META = {
    boss: {
        icon: '👑',
        short: 'Boss',
        className: 'wb-arena-mode-boss',
        blurb: 'Clear every stage to win.',
    },
    response_duel: {
        icon: '⚔️',
        short: 'Duel',
        className: 'wb-arena-mode-duel',
        blurb: 'Pick the stronger response.',
    },
    spot_the_error: {
        icon: '🎯',
        short: 'Spot',
        className: 'wb-arena-mode-spot',
        blurb: 'Find the critical flaw.',
    },
    rule_match: {
        icon: '🧩',
        short: 'Match',
        className: 'wb-arena-mode-match',
        blurb: 'Link examples to rules.',
    },
    scenario: {
        icon: '🗺️',
        short: 'Scenario',
        className: 'wb-arena-mode-scenario',
        blurb: 'Choose the best action.',
    },
    daily: {
        icon: '🔥',
        short: 'Daily',
        className: 'wb-arena-mode-daily',
        blurb: 'Today\'s featured quest.',
    },
};

export function modeMeta(mode) {
    return MODE_META[mode] ?? {
        icon: '⭐',
        short: 'Quest',
        className: 'wb-arena-mode-default',
        blurb: 'Practice your skills.',
    };
}

export function difficultyTier(difficulty) {
    const d = difficulty ?? 2;
    if (d <= 1) return { label: 'Easy', className: 'easy', stars: 1 };
    if (d <= 2) return { label: 'Medium', className: 'medium', stars: 2 };
    if (d <= 3) return { label: 'Hard', className: 'hard', stars: 3 };
    return { label: 'Epic', className: 'epic', stars: Math.min(5, d) };
}
