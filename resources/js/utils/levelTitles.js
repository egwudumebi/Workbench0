const TITLES = {
    1: 'Starter Evaluator',
    2: 'Apprentice Analyst',
    3: 'Rising Evaluator',
    4: 'Skilled Reviewer',
    5: 'Senior Evaluator',
    6: 'Master Reviewer',
    7: 'Expert Evaluator',
    8: 'Elite Evaluator',
};

export function levelTitle(level) {
    return TITLES[level] ?? `Level ${level}`;
}
