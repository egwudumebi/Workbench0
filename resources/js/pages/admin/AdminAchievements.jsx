import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminAchievements, updateAdminAchievement } from '../../api/admin';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import {
    achievementBadgeVisual,
    achievementCriteriaCategory,
    achievementCriteriaTone,
    formatAchievementCriteria,
} from '../../utils/achievementAdminDisplay';

function AchievementCard({ row, xpDraft, onXpChange, onSave, saving, savedFlash }) {
    const visual = achievementBadgeVisual(row.slug);
    const criteriaTone = achievementCriteriaTone(row.criteria_type);
    const category = achievementCriteriaCategory(row.criteria_type);
    const draft = xpDraft[row.id] ?? row.xp_reward;
    const dirty = Number(draft) !== row.xp_reward;
    const earned = row.earned_count > 0;

    return (
        <article className={`wb-admin-ach-card ${earned ? 'is-earned' : ''}`}>
            <div className="wb-admin-ach-card-top">
                <span
                    className={`wb-admin-ach-badge wb-admin-ach-badge--${visual.tone}`}
                    aria-hidden
                >
                    {visual.emoji}
                </span>
                <div className="wb-admin-ach-copy">
                    <h3 className="wb-admin-ach-name">{row.name}</h3>
                    <p className="wb-admin-ach-desc">{row.description}</p>
                    <code className="wb-admin-ach-slug">{row.slug}</code>
                </div>
            </div>

            <div className="wb-admin-ach-meta">
                <span className={`wb-admin-ach-criteria wb-admin-ach-criteria--${criteriaTone}`}>
                    {formatAchievementCriteria(row.criteria_type, row.criteria_value)}
                </span>
                <span className="wb-admin-ach-category">{category}</span>
            </div>

            <div className="wb-admin-ach-footer">
                <div className="wb-admin-ach-xp">
                    <label className="wb-admin-ach-xp-label" htmlFor={`xp-${row.id}`}>
                        XP reward
                    </label>
                    <div className="wb-admin-ach-xp-row">
                        <input
                            id={`xp-${row.id}`}
                            type="number"
                            min={0}
                            max={1000}
                            className="form-control form-control-sm"
                            value={draft}
                            disabled={saving}
                            onChange={(e) => onXpChange(row.id, e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && dirty) {
                                    e.preventDefault();
                                    onSave(row);
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={!dirty || saving}
                            onClick={() => onSave(row)}
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                    {savedFlash === row.id ? (
                        <span className="wb-admin-ach-saved" role="status">
                            Saved
                        </span>
                    ) : (
                        <span className="wb-admin-ach-xp-hint">0–1000 · Enter or Save to apply</span>
                    )}
                </div>

                <div className="wb-admin-ach-earned">
                    <span className="wb-admin-ach-earned-value">{row.earned_count}</span>
                    <span className="wb-admin-ach-earned-label">
                        learner{row.earned_count === 1 ? '' : 's'} earned
                    </span>
                </div>
            </div>
        </article>
    );
}

export default function AdminAchievements() {
    const [achievements, setAchievements] = useState([]);
    const [xpDraft, setXpDraft] = useState({});
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [savedFlash, setSavedFlash] = useState(null);

    const load = async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            const rows = await fetchAdminAchievements();
            setAchievements(rows);
            setXpDraft(Object.fromEntries(rows.map((r) => [r.id, r.xp_reward])));
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const categories = useMemo(() => {
        const set = new Set(achievements.map((a) => achievementCriteriaCategory(a.criteria_type)));
        return ['all', ...Array.from(set).sort()];
    }, [achievements]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return achievements.filter((row) => {
            if (categoryFilter !== 'all' && achievementCriteriaCategory(row.criteria_type) !== categoryFilter) {
                return false;
            }
            if (!q) return true;
            return (
                row.name.toLowerCase().includes(q) ||
                row.slug.toLowerCase().includes(q) ||
                row.description?.toLowerCase().includes(q)
            );
        });
    }, [achievements, search, categoryFilter]);

    const summary = useMemo(() => {
        const totalEarned = achievements.reduce((sum, a) => sum + (a.earned_count ?? 0), 0);
        const withUnlocks = achievements.filter((a) => a.earned_count > 0).length;
        const maxXp = achievements.reduce((sum, a) => sum + (a.xp_reward ?? 0), 0);
        return {
            badges: achievements.length,
            totalEarned,
            withUnlocks,
            maxXp,
        };
    }, [achievements]);

    const handleXpChange = (id, value) => {
        setXpDraft((prev) => ({ ...prev, [id]: value }));
    };

    const handleSave = async (row) => {
        const value = Number(xpDraft[row.id]);
        if (Number.isNaN(value) || value < 0 || value > 1000) return;
        if (value === row.xp_reward) return;

        setSavingId(row.id);
        try {
            await updateAdminAchievement(row.id, { xp_reward: value });
            setSavedFlash(row.id);
            window.setTimeout(() => setSavedFlash(null), 2000);
            await load({ silent: true });
        } catch (err) {
            setError(err);
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="wb-admin-page wb-admin-page--achievements">
            <header className="wb-admin-list-hero">
                <div className="wb-admin-list-hero-main">
                    <p className="wb-admin-eyebrow">Gamification</p>
                    <h1 className="wb-admin-dash-title">
                        <span className="wb-admin-dash-title-brand">Workbench</span>
                        <span className="wb-admin-dash-title-dot" aria-hidden>
                            ·
                        </span>
                        <span className="wb-admin-dash-title-role">Achievements</span>
                    </h1>
                    <p className="wb-admin-dash-lead">
                        Configure badge XP rewards and monitor unlock rates. Criteria are evaluated automatically when
                        learners progress.
                    </p>
                </div>
                {!loading && achievements.length > 0 ? (
                    <ul className="wb-admin-dash-hero-kpis" aria-label="Achievement summary">
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.badges}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Badges defined</span>
                        </li>
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.totalEarned}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Total unlocks</span>
                        </li>
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.withUnlocks}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Badges with earners</span>
                        </li>
                    </ul>
                ) : null}
            </header>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <div className="wb-admin-ach-toolbar">
                <label className="wb-admin-list-search wb-admin-ach-search">
                    <span className="wb-admin-list-search-icon" aria-hidden>
                        ⌕
                    </span>
                    <input
                        type="search"
                        className="form-control"
                        placeholder="Search badges…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search achievements"
                    />
                </label>
                <div className="wb-admin-ach-filters" role="group" aria-label="Filter by category">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            className={`wb-admin-ach-filter ${categoryFilter === cat ? 'is-active' : ''}`}
                            onClick={() => setCategoryFilter(cat)}
                        >
                            {cat === 'all' ? 'All' : cat}
                        </button>
                    ))}
                </div>
                <Link to="/admin/learners" className="btn btn-sm btn-outline-secondary wb-admin-ach-learners-link">
                    View learners
                </Link>
            </div>

            {loading ? (
                <LoadingState message="Loading achievements…" />
            ) : filtered.length > 0 ? (
                <>
                    <p className="wb-admin-list-result-count mb-3">
                        Showing {filtered.length} of {achievements.length} badges
                        {summary.maxXp > 0 ? (
                            <span className="text-muted"> · Up to {summary.maxXp} XP if all earned once</span>
                        ) : null}
                    </p>
                    <div className="wb-admin-ach-grid">
                        {filtered.map((row) => (
                            <AchievementCard
                                key={row.id}
                                row={row}
                                xpDraft={xpDraft}
                                onXpChange={handleXpChange}
                                onSave={handleSave}
                                saving={savingId === row.id}
                                savedFlash={savedFlash}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="wb-admin-dash-empty">
                    <div className="wb-admin-dash-empty-icon" aria-hidden>
                        🏅
                    </div>
                    <h2 className="wb-admin-dash-empty-title">
                        {search.trim() || categoryFilter !== 'all'
                            ? 'No badges match your filters'
                            : 'No achievements configured'}
                    </h2>
                    <p className="wb-admin-dash-empty-text">
                        {search.trim() || categoryFilter !== 'all'
                            ? 'Try clearing search or choosing All categories.'
                            : 'Run database seeders to load default academy badges.'}
                    </p>
                    {(search.trim() || categoryFilter !== 'all') && (
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                                setSearch('');
                                setCategoryFilter('all');
                            }}
                        >
                            Reset filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
