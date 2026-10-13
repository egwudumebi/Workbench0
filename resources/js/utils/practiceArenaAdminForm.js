const DEFAULT_DUEL = {
    prompt: 'User asks whether they can return a headset after 45 days.',
    response_a: 'Our standard return window is 30 days; after that returns are not accepted unless defective.',
    response_b: 'Sure, you can return anything anytime—we always say yes to keep customers happy!',
    decision: 'response_a',
    min_explanation_length: 20,
    rationale: 'Response A follows policy; B invents permissive rules.',
};

const DEFAULT_SPOT = {
    response: 'Studies show 94% of users prefer our premium tier, so you should upgrade today.',
    errors: [
        { id: 'unsupported_stat', label: 'Unsupported statistic presented as fact' },
        { id: 'tone', label: 'Tone is too casual' },
    ],
    error_id: 'unsupported_stat',
    explanation: 'The response cites a precise statistic with no source.',
};

const DEFAULT_RULE = {
    rules: [
        { id: 'cite', text: 'Cite evidence from the response' },
        { id: 'no_invent', text: 'Do not invent policy facts' },
    ],
    examples: [
        { id: 'ex1', text: 'The answer claims a 90-day guarantee with no source.' },
        { id: 'ex2', text: 'Explanation quotes the sentence that contradicts the prompt.' },
    ],
    pairs: [
        { example_id: 'ex1', rule_id: 'no_invent' },
        { example_id: 'ex2', rule_id: 'cite' },
    ],
};

const DEFAULT_SCENARIO = {
    scenario: 'The prompt references an account ID but the response guesses billing details.',
    choices: [
        { id: 'approve_excellent', label: 'Rate excellent for helpful tone' },
        { id: 'flag_uncertainty', label: 'Flag uncertainty and note missing context' },
        { id: 'rewrite', label: 'Rewrite the response yourself' },
    ],
    best_choice: 'flag_uncertainty',
    feedback_flag: 'Correct: note missing context rather than inventing facts.',
    feedback_approve: 'Tone does not compensate for unsupported billing details.',
};

const DEFAULT_BOSS = {
    intro: 'Three quick evaluation decisions.',
    stages: [
        { prompt: 'Response contradicts the stated return policy.', answer: 'incorrect' },
        { prompt: 'Pairwise: A is grounded; B is vague.', answer: 'response_a' },
    ],
};

export function defaultModeFields(mode) {
    switch (mode) {
        case 'spot_the_error':
            return { spot: { ...DEFAULT_SPOT, errors: DEFAULT_SPOT.errors.map((e) => ({ ...e })) } };
        case 'rule_match':
            return {
                rule: {
                    rules: DEFAULT_RULE.rules.map((r) => ({ ...r })),
                    examples: DEFAULT_RULE.examples.map((e) => ({ ...e })),
                    pairs: DEFAULT_RULE.pairs.map((p) => ({ ...p })),
                },
            };
        case 'scenario':
            return {
                scenario: {
                    ...DEFAULT_SCENARIO,
                    choices: DEFAULT_SCENARIO.choices.map((c) => ({ ...c })),
                },
            };
        case 'boss':
            return { boss: { ...DEFAULT_BOSS, stages: DEFAULT_BOSS.stages.map((s) => ({ ...s })) } };
        case 'response_duel':
        default:
            return { duel: { ...DEFAULT_DUEL } };
    }
}

export function modeFieldsFromChallenge(mode, content = {}, answerKey = {}) {
    switch (mode) {
        case 'spot_the_error':
            return {
                spot: {
                    response: content.response ?? '',
                    errors: (content.errors ?? []).map((e) => ({ id: e.id ?? '', label: e.label ?? '' })),
                    error_id: answerKey.error_id ?? '',
                    explanation: answerKey.explanation ?? '',
                },
            };
        case 'rule_match': {
            const pairsObj = answerKey.pairs ?? {};
            const pairs = Object.entries(pairsObj).map(([example_id, rule_id]) => ({
                example_id,
                rule_id,
            }));
            return {
                rule: {
                    rules: (content.rules ?? []).map((r) => ({ id: r.id ?? '', text: r.text ?? '' })),
                    examples: (content.examples ?? []).map((e) => ({ id: e.id ?? '', text: e.text ?? '' })),
                    pairs: pairs.length ? pairs : [{ example_id: '', rule_id: '' }],
                },
            };
        }
        case 'scenario': {
            const choicesObj = content.choices ?? {};
            const choices = typeof choicesObj === 'object' && !Array.isArray(choicesObj)
                ? Object.entries(choicesObj).map(([id, label]) => ({ id, label }))
                : [];
            const feedback = answerKey.feedback ?? {};
            return {
                scenario: {
                    scenario: content.scenario ?? '',
                    choices: choices.length ? choices : [{ id: '', label: '' }],
                    best_choice: answerKey.best_choice ?? '',
                    feedback_flag: feedback.flag_uncertainty ?? '',
                    feedback_approve: feedback.approve_excellent ?? '',
                },
            };
        }
        case 'boss':
            return {
                boss: {
                    intro: content.intro ?? '',
                    stages: (answerKey.stages ?? []).map((s) => ({
                        prompt: s.prompt ?? '',
                        answer: s.answer ?? '',
                    })),
                },
            };
        case 'response_duel':
        default:
            return {
                duel: {
                    prompt: content.prompt ?? '',
                    response_a: content.response_a ?? '',
                    response_b: content.response_b ?? '',
                    decision: answerKey.decision ?? 'response_a',
                    min_explanation_length: answerKey.min_explanation_length ?? 20,
                    rationale: answerKey.rationale ?? '',
                },
            };
    }
}

export function buildChallengePayload(mode, modeFields) {
    switch (mode) {
        case 'spot_the_error': {
            const s = modeFields.spot;
            return {
                content: {
                    response: s.response,
                    errors: s.errors.filter((e) => e.id && e.label),
                },
                answer_key: {
                    error_id: s.error_id,
                    explanation: s.explanation,
                },
            };
        }
        case 'rule_match': {
            const r = modeFields.rule;
            const pairs = {};
            r.pairs.forEach(({ example_id, rule_id }) => {
                if (example_id && rule_id) pairs[example_id] = rule_id;
            });
            return {
                content: {
                    rules: r.rules.filter((x) => x.id && x.text),
                    examples: r.examples.filter((x) => x.id && x.text),
                },
                answer_key: { pairs },
            };
        }
        case 'scenario': {
            const sc = modeFields.scenario;
            const choices = {};
            sc.choices.forEach(({ id, label }) => {
                if (id) choices[id] = label;
            });
            const feedback = {};
            if (sc.feedback_flag) feedback.flag_uncertainty = sc.feedback_flag;
            if (sc.feedback_approve) feedback.approve_excellent = sc.feedback_approve;
            return {
                content: { scenario: sc.scenario, choices },
                answer_key: {
                    best_choice: sc.best_choice,
                    acceptable_choices: sc.best_choice ? [sc.best_choice] : [],
                    feedback,
                },
            };
        }
        case 'boss': {
            const b = modeFields.boss;
            return {
                content: { intro: b.intro },
                answer_key: {
                    stages: b.stages.filter((s) => s.prompt).map((s) => ({
                        prompt: s.prompt,
                        answer: s.answer,
                    })),
                },
            };
        }
        case 'response_duel':
        default: {
            const d = modeFields.duel;
            return {
                content: {
                    prompt: d.prompt,
                    response_a: d.response_a,
                    response_b: d.response_b,
                },
                answer_key: {
                    decision: d.decision,
                    min_explanation_length: Number(d.min_explanation_length) || 20,
                    rationale: d.rationale,
                },
            };
        }
    }
}

export function emptyArenaForm() {
    return {
        id: null,
        title: '',
        slug: '',
        mode: 'response_duel',
        instructions: '',
        difficulty: 2,
        training_program_id: '',
        skill_slugs: 'factual-accuracy',
        active: true,
        is_daily: false,
        ...defaultModeFields('response_duel'),
    };
}

export function arenaFormFromRow(row) {
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        mode: row.mode,
        instructions: row.instructions ?? '',
        difficulty: row.difficulty ?? 2,
        training_program_id: row.training_program_id ? String(row.training_program_id) : '',
        skill_slugs: (row.skill_slugs ?? []).join(', '),
        active: row.active,
        is_daily: row.is_daily,
        ...modeFieldsFromChallenge(row.mode, row.content ?? {}, row.answer_key ?? {}),
    };
}
