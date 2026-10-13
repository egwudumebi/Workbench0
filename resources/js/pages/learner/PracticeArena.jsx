import { useEffect, useMemo, useState } from 'react';
import {
    fetchPracticeChallenge,
    fetchPracticeChallenges,
    submitPracticeChallenge,
} from '../../api/academy';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { useAcademyStats } from '../../context/AcademyStatsContext';
import {
    PRACTICE_PASS_XP,
    difficultyTier,
    modeMeta,
} from '../../utils/practiceArenaModes';

const MODE_FILTERS = [
    { id: 'all', label: 'All quests' },
    { id: 'boss', label: 'Boss' },
    { id: 'response_duel', label: 'Duels' },
    { id: 'spot_the_error', label: 'Spot' },
    { id: 'rule_match', label: 'Match' },
    { id: 'scenario', label: 'Scenarios' },
];

export default function PracticeArena() {
    const { stats: academy, refresh: refreshStats } = useAcademyStats();
    const [challenges, setChallenges] = useState([]);
    const [active, setActive] = useState(null);
    const [submission, setSubmission] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openingId, setOpeningId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [modeFilter, setModeFilter] = useState('all');
    const [victories, setVictories] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                setChallenges(await fetchPracticeChallenges());
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const profile = academy?.profile;
    const dailyId = academy?.daily_challenge?.id;

    const filtered = useMemo(() => {
        if (modeFilter === 'all') return challenges;
        return challenges.filter((c) => c.mode === modeFilter);
    }, [challenges, modeFilter]);

    const dailyChallenge = useMemo(
        () => challenges.find((c) => c.is_daily || c.id === dailyId),
        [challenges, dailyId],
    );

    const openChallenge = async (id) => {
        setOpeningId(id);
        setResult(null);
        setSubmission({});
        try {
            setActive(await fetchPracticeChallenge(id));
        } catch (err) {
            setError(err);
        } finally {
            setOpeningId(null);
        }
    };

    const handleSubmit = async () => {
        if (!active || submitting) return;
        setSubmitting(true);
        try {
            const res = await submitPracticeChallenge(active.id, submission);
            setResult(res);
            if (res.result?.passed) {
                setVictories((v) => v + 1);
                refreshStats();
            }
        } catch (err) {
            setError(err);
        } finally {
            setSubmitting(false);
        }
    };

    const activeMeta = active ? modeMeta(active.mode) : null;
    const activeDiff = active ? difficultyTier(active.difficulty) : null;

    return (
        <div className="wb-arena-page">
            <section className="wb-arena-hero">
                <div className="wb-arena-hero-glow" aria-hidden />
                <div className="wb-arena-hero-inner">
                    <div>
                        <p className="wb-arena-eyebrow">Training ground</p>
                        <h1 className="wb-arena-title">Practice Arena</h1>
                        <p className="wb-arena-sub">
                            Level up your evaluator instincts — duels, scenarios, and boss runs powered by real rubrics.
                        </p>
                    </div>
                    <div className="wb-arena-hero-stats">
                        <div className="wb-arena-stat">
                            <span className="wb-arena-stat-value">{challenges.length || '—'}</span>
                            <span className="wb-arena-stat-label">Quests</span>
                        </div>
                        <div className="wb-arena-stat">
                            <span className="wb-arena-stat-value">
                                {profile?.streak_days ?? 0}
                                <span className="wb-arena-stat-icon">🔥</span>
                            </span>
                            <span className="wb-arena-stat-label">Streak</span>
                        </div>
                        <div className="wb-arena-stat wb-arena-stat-gold">
                            <span className="wb-arena-stat-value">+{PRACTICE_PASS_XP} XP</span>
                            <span className="wb-arena-stat-label">Per victory</span>
                        </div>
                        {victories > 0 && (
                            <div className="wb-arena-stat wb-arena-stat-win">
                                <span className="wb-arena-stat-value">{victories}</span>
                                <span className="wb-arena-stat-label">This session</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <div className="row g-4 wb-arena-layout">
                <div className="col-lg-5">
                    {dailyChallenge && modeFilter === 'all' && (
                        <button
                            type="button"
                            className="wb-arena-daily-banner"
                            onClick={() => openChallenge(dailyChallenge.id)}
                        >
                            <span className="wb-arena-daily-badge">Daily quest</span>
                            <span className="wb-arena-daily-title">{dailyChallenge.title}</span>
                            <span className="wb-arena-daily-cta">Play now →</span>
                        </button>
                    )}

                    <div className="wb-arena-filter-row">
                        {MODE_FILTERS.filter((f) => f.id === 'all' || challenges.some((c) => c.mode === f.id)).map(
                            (f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    className={`wb-arena-filter ${modeFilter === f.id ? 'active' : ''}`}
                                    onClick={() => setModeFilter(f.id)}
                                >
                                    {f.label}
                                </button>
                            ),
                        )}
                    </div>

                    {loading ? (
                        <LoadingState />
                    ) : (
                        <div className="wb-arena-quest-grid">
                            {filtered.map((c) => {
                                const meta = modeMeta(c.mode);
                                const diff = difficultyTier(c.difficulty);
                                const isActive = active?.id === c.id;
                                const isOpening = openingId === c.id;

                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className={`wb-arena-quest-card ${meta.className} ${isActive ? 'is-selected' : ''}`}
                                        onClick={() => openChallenge(c.id)}
                                        disabled={isOpening}
                                    >
                                        <div className="wb-arena-quest-icon">{meta.icon}</div>
                                        <div className="wb-arena-quest-body">
                                            <div className="wb-arena-quest-top">
                                                <span className="wb-arena-quest-mode">{c.mode_label}</span>
                                                {c.is_daily && <span className="wb-arena-quest-daily">Daily</span>}
                                            </div>
                                            <div className="wb-arena-quest-title">{c.title}</div>
                                            <div className="wb-arena-quest-meta">
                                                <span className={`wb-arena-diff wb-arena-diff-${diff.className}`}>
                                                    {Array.from({ length: diff.stars }).map((_, i) => (
                                                        <span key={i} className="wb-arena-star">★</span>
                                                    ))}
                                                    <span className="wb-arena-diff-label">{diff.label}</span>
                                                </span>
                                                <span className="wb-arena-xp-chip">+{PRACTICE_PASS_XP} XP</span>
                                            </div>
                                        </div>
                                        {isOpening && <span className="wb-arena-quest-loading">Loading…</span>}
                                    </button>
                                );
                            })}
                            {!filtered.length && (
                                <p className="text-muted small px-1">No quests in this category yet.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="col-lg-7">
                    <div className={`wb-arena-stage ${active ? 'has-quest' : ''}`}>
                        {!active ? (
                            <ArenaEmptyState onPick={dailyChallenge ? () => openChallenge(dailyChallenge.id) : null} />
                        ) : (
                            <>
                                <header className={`wb-arena-stage-header ${activeMeta.className}`}>
                                    <div className="wb-arena-stage-icon">{activeMeta.icon}</div>
                                    <div className="wb-arena-stage-headings">
                                        <span className="wb-arena-stage-mode">{active.mode_label}</span>
                                        <h2 className="wb-arena-stage-title">{active.title}</h2>
                                    </div>
                                    <div className="wb-arena-stage-rewards">
                                        <span className={`wb-arena-diff wb-arena-diff-${activeDiff.className}`}>
                                            {activeDiff.label}
                                        </span>
                                        <span className="wb-arena-xp-chip large">+{PRACTICE_PASS_XP} XP</span>
                                    </div>
                                </header>

                                <div className="wb-arena-briefing">
                                    <div className="wb-arena-briefing-label">Mission briefing</div>
                                    <p>{active.instructions}</p>
                                </div>

                                <div className="wb-arena-playfield">
                                    <ChallengeForm challenge={active} submission={submission} onChange={setSubmission} />
                                </div>

                                <div className="wb-arena-actions">
                                    <button
                                        type="button"
                                        className="btn wb-arena-submit"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Checking…' : 'Lock in answer'}
                                    </button>
                                </div>

                                {result && (
                                    <ResultPanel result={result} xp={PRACTICE_PASS_XP} onRetry={() => setResult(null)} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ArenaEmptyState({ onPick }) {
    return (
        <div className="wb-arena-empty">
            <div className="wb-arena-empty-orbs" aria-hidden>
                <span>⚔️</span>
                <span>🎯</span>
                <span>👑</span>
            </div>
            <h2 className="wb-arena-empty-title">Choose your quest</h2>
            <p className="wb-arena-empty-text">
                Pick a challenge from the left to enter the arena. Each victory earns XP and keeps your streak alive.
            </p>
            {onPick && (
                <button type="button" className="btn wb-arena-submit" onClick={onPick}>
                    Start daily quest
                </button>
            )}
        </div>
    );
}

function ResultPanel({ result, xp, onRetry }) {
    const passed = result.result?.passed;
    const score = result.result?.score_percent;
    const summary = result.result?.feedback?.summary;

    return (
        <div className={`wb-arena-result ${passed ? 'is-victory' : 'is-retry'}`}>
            <div className="wb-arena-result-badge">{passed ? '🏆 Victory' : '💪 Keep going'}</div>
            <div className="wb-arena-result-score">
                <span className="wb-arena-result-pct">{score}%</span>
                <span className="wb-arena-result-label">Score</span>
            </div>
            <p className="wb-arena-result-summary">{summary}</p>
            {passed && (
                <p className="wb-arena-result-xp">+{xp} XP added to your profile</p>
            )}
            <button type="button" className="btn btn-sm btn-outline-light wb-arena-result-retry" onClick={onRetry}>
                Try again
            </button>
        </div>
    );
}

function ChallengeForm({ challenge, submission, onChange }) {
    const content = challenge.content ?? {};
    const mode = challenge.mode;

    if (mode === 'response_duel' || mode === 'daily') {
        return (
            <div className="wb-arena-form">
                <div className="wb-arena-panel wb-arena-panel-prompt">{content.prompt}</div>
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="wb-arena-duel-card a">
                            <span className="wb-arena-duel-tag">A</span>
                            <p>{content.response_a}</p>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="wb-arena-duel-card b">
                            <span className="wb-arena-duel-tag">B</span>
                            <p>{content.response_b}</p>
                        </div>
                    </div>
                </div>
                <label className="wb-arena-field-label">Your verdict</label>
                <select
                    className="form-select wb-arena-select"
                    value={submission.decision ?? ''}
                    onChange={(e) => onChange({ ...submission, decision: e.target.value })}
                >
                    <option value="">Choose…</option>
                    <option value="response_a">Response A wins</option>
                    <option value="response_b">Response B wins</option>
                    <option value="both_equal">Tie</option>
                </select>
                <label className="wb-arena-field-label">Explain with rubric language</label>
                <textarea
                    className="form-control wb-arena-textarea"
                    rows={3}
                    placeholder="Why is this the stronger evaluation?"
                    value={submission.explanation ?? ''}
                    onChange={(e) => onChange({ ...submission, explanation: e.target.value })}
                />
            </div>
        );
    }

    if (mode === 'spot_the_error') {
        return (
            <div className="wb-arena-form">
                <div className="wb-arena-panel">{content.response}</div>
                <div className="wb-arena-choice-stack">
                    {(content.errors ?? []).map((err) => (
                        <label
                            key={err.id}
                            className={`wb-arena-choice ${submission.error_id === err.id ? 'selected' : ''}`}
                        >
                            <input
                                type="radio"
                                className="form-check-input"
                                checked={submission.error_id === err.id}
                                onChange={() => onChange({ ...submission, error_id: err.id })}
                            />
                            <span>{err.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        );
    }

    if (mode === 'rule_match') {
        const pairs = submission.pairs ?? {};
        return (
            <div className="wb-arena-form">
                {(content.examples ?? []).map((ex) => (
                    <div key={ex.id} className="wb-arena-match-row">
                        <div className="wb-arena-match-example">{ex.text}</div>
                        <select
                            className="form-select wb-arena-select"
                            value={pairs[ex.id] ?? ''}
                            onChange={(e) => onChange({ pairs: { ...pairs, [ex.id]: e.target.value } })}
                        >
                            <option value="">Select rule…</option>
                            {(content.rules ?? []).map((r) => (
                                <option key={r.id} value={r.id}>{r.text}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        );
    }

    if (mode === 'scenario') {
        return (
            <div className="wb-arena-form">
                <div className="wb-arena-panel wb-arena-panel-scenario">{content.scenario}</div>
                <div className="wb-arena-choice-stack">
                    {Object.entries(content.choices ?? {}).map(([key, label]) => (
                        <label
                            key={key}
                            className={`wb-arena-choice ${submission.choice === key ? 'selected' : ''}`}
                        >
                            <input
                                type="radio"
                                className="form-check-input"
                                checked={submission.choice === key}
                                onChange={() => onChange({ ...submission, choice: key })}
                            />
                            <span>{label}</span>
                        </label>
                    ))}
                </div>
            </div>
        );
    }

    if (mode === 'boss') {
        const stages = submission.stages ?? [];
        return (
            <div className="wb-arena-form">
                {content.intro && <p className="wb-arena-boss-intro">{content.intro}</p>}
                {[0, 1, 2].map((i) => (
                    <div key={i} className="wb-arena-boss-stage">
                        <span className="wb-arena-boss-stage-num">Stage {i + 1}</span>
                        <input
                            className="form-control wb-arena-input"
                            placeholder="Your evaluation call…"
                            value={stages[i]?.answer ?? ''}
                            onChange={(e) => {
                                const next = [...stages];
                                next[i] = { answer: e.target.value };
                                onChange({ ...submission, stages: next });
                            }}
                        />
                    </div>
                ))}
            </div>
        );
    }

    return <p className="text-muted">Unsupported mode.</p>;
}
