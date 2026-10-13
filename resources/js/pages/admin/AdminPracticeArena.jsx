import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    createAdminPracticeChallenge,
    fetchAdminPracticeChallenges,
    fetchAdminTrainingPrograms,
    updateAdminPracticeChallenge,
} from '../../api/admin';
import AdminArenaChallengeForm from '../../components/admin/AdminArenaChallengeForm';
import NavIcon from '../../components/ui/NavIcons';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import {
    arenaFormFromRow,
    buildChallengePayload,
    emptyArenaForm,
} from '../../utils/practiceArenaAdminForm';
import { difficultyTier, modeMeta } from '../../utils/practiceArenaModes';

const MODES = ['response_duel', 'spot_the_error', 'rule_match', 'scenario', 'boss'];

function ModeBadge({ mode }) {
    const meta = modeMeta(mode);
    return (
        <span className={`wb-admin-arena-mode-badge ${meta.className}`} title={meta.blurb}>
            <span aria-hidden>{meta.icon}</span>
            {meta.short}
        </span>
    );
}

function DifficultyDots({ difficulty }) {
    const tier = difficultyTier(difficulty);
    return (
        <span className={`wb-admin-arena-diff wb-admin-arena-diff--${tier.className}`} title={tier.label}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= tier.stars ? 'is-on' : ''} />
            ))}
            <span className="wb-admin-arena-diff-label">{tier.label}</span>
        </span>
    );
}

function ChallengeCard({ row, onEdit, onToggleActive, toggling }) {
    const inactive = !row.active;

    return (
        <article className={`wb-admin-arena-card ${inactive ? 'is-hidden' : ''}`}>
            <div className="wb-admin-arena-card-main">
                <span className="wb-admin-arena-card-icon" aria-hidden>
                    {modeMeta(row.mode).icon}
                </span>
                <div className="wb-admin-arena-card-copy">
                    <h3 className="wb-admin-arena-card-title">{row.title}</h3>
                    <code className="wb-admin-arena-card-slug">{row.slug}</code>
                    <div className="wb-admin-arena-card-meta">
                        <ModeBadge mode={row.mode} />
                        <DifficultyDots difficulty={row.difficulty} />
                        {row.program?.name ? (
                            <Link
                                to={`/admin/training-programs/${row.program.id}`}
                                className="wb-admin-arena-program-link"
                            >
                                {row.program.name}
                            </Link>
                        ) : (
                            <span className="wb-admin-arena-program-muted">Any programme</span>
                        )}
                    </div>
                    <div className="wb-admin-arena-flags">
                        {row.is_daily ? <span className="wb-admin-arena-flag wb-admin-arena-flag--daily">Daily</span> : null}
                        {inactive ? <span className="wb-admin-arena-flag wb-admin-arena-flag--hidden">Hidden</span> : null}
                        {row.active && !row.is_daily ? (
                            <span className="wb-admin-arena-flag wb-admin-arena-flag--live">Live</span>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="wb-admin-arena-card-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(row)}>
                    Edit
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    disabled={toggling === row.id}
                    onClick={() => onToggleActive(row)}
                >
                    {toggling === row.id ? '…' : row.active ? 'Hide' : 'Publish'}
                </button>
            </div>
        </article>
    );
}

export default function AdminPracticeArena() {
    const [challenges, setChallenges] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [modeFilter, setModeFilter] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(emptyArenaForm());
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [togglingId, setTogglingId] = useState(null);

    const load = async (p = page, { silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            const response = await fetchAdminPracticeChallenges({
                page: p,
                mode: modeFilter || undefined,
                search: search.trim() || undefined,
            });
            setChallenges(response.data ?? []);
            setMeta(response.meta);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminTrainingPrograms().then(setPrograms).catch(() => {});
    }, []);

    useEffect(() => {
        load(page);
    }, [page, modeFilter, search]);

    const editing = Boolean(form.id);

    const summary = useMemo(() => {
        const active = challenges.filter((c) => c.active).length;
        const daily = challenges.filter((c) => c.is_daily).length;
        return { total: meta?.total ?? challenges.length, active, daily };
    }, [challenges, meta]);

    const openCreate = () => {
        setForm(emptyArenaForm());
        setShowForm(true);
    };

    const openEdit = (row) => {
        setForm(arenaFormFromRow(row));
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setForm(emptyArenaForm());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const { content, answer_key } = buildChallengePayload(form.mode, form);
            const payload = {
                title: form.title,
                slug: form.slug.trim() || undefined,
                mode: form.mode,
                instructions: form.instructions,
                difficulty: Number(form.difficulty),
                training_program_id: form.training_program_id ? Number(form.training_program_id) : null,
                content,
                answer_key,
                skill_slugs: form.skill_slugs
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                active: form.active,
                is_daily: form.is_daily,
            };

            if (editing) {
                await updateAdminPracticeChallenge(form.id, payload);
            } else {
                await createAdminPracticeChallenge(payload);
            }
            closeForm();
            await load(page, { silent: true });
        } catch (err) {
            setError(err);
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (row) => {
        setTogglingId(row.id);
        try {
            await updateAdminPracticeChallenge(row.id, { active: !row.active });
            await load(page, { silent: true });
        } catch (err) {
            setError(err);
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="wb-admin-page wb-admin-page--arena">
            <header className="wb-admin-list-hero">
                <div className="wb-admin-list-hero-main">
                    <p className="wb-admin-eyebrow">Content</p>
                    <h1 className="wb-admin-dash-title">
                        <span className="wb-admin-dash-title-brand">Workbench</span>
                        <span className="wb-admin-dash-title-dot" aria-hidden>
                            ·
                        </span>
                        <span className="wb-admin-dash-title-role">Practice Arena</span>
                    </h1>
                    <p className="wb-admin-dash-lead">
                        Quest-style challenges for the learner arena—duels, spot-the-error, scenarios, and boss runs.
                    </p>
                </div>
                <div className="wb-admin-project-hero-actions">
                    {!loading ? (
                        <ul className="wb-admin-dash-hero-kpis" aria-label="Arena summary">
                            <li>
                                <span className="wb-admin-dash-hero-kpi-value">{summary.total}</span>
                                <span className="wb-admin-dash-hero-kpi-label">Challenges</span>
                            </li>
                            <li>
                                <span className="wb-admin-dash-hero-kpi-value">{summary.active}</span>
                                <span className="wb-admin-dash-hero-kpi-label">Live on page</span>
                            </li>
                            <li>
                                <span className="wb-admin-dash-hero-kpi-value">{summary.daily}</span>
                                <span className="wb-admin-dash-hero-kpi-label">Daily flagged</span>
                            </li>
                        </ul>
                    ) : null}
                    {!showForm ? (
                        <button type="button" className="btn btn-primary wb-admin-project-new-btn" onClick={openCreate}>
                            New challenge
                        </button>
                    ) : null}
                </div>
            </header>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            {!showForm ? (
                <>
                    <div className="wb-admin-arena-toolbar">
                        <label className="wb-admin-list-search">
                            <span className="wb-admin-list-search-icon" aria-hidden>
                                ⌕
                            </span>
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search title or slug…"
                                value={search}
                                onChange={(e) => {
                                    setPage(1);
                                    setSearch(e.target.value);
                                }}
                                aria-label="Search challenges"
                            />
                        </label>
                        <div className="wb-admin-ach-filters" role="group" aria-label="Filter by mode">
                            <button
                                type="button"
                                className={`wb-admin-ach-filter ${modeFilter === '' ? 'is-active' : ''}`}
                                onClick={() => {
                                    setPage(1);
                                    setModeFilter('');
                                }}
                            >
                                All modes
                            </button>
                            {MODES.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    className={`wb-admin-ach-filter ${modeFilter === m ? 'is-active' : ''}`}
                                    onClick={() => {
                                        setPage(1);
                                        setModeFilter(m);
                                    }}
                                >
                                    {modeMeta(m).icon} {modeMeta(m).short}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <LoadingState message="Loading challenges…" />
                    ) : challenges.length > 0 ? (
                        <>
                            <p className="wb-admin-list-result-count mb-3">
                                {meta?.total ?? challenges.length} challenge
                                {(meta?.total ?? challenges.length) === 1 ? '' : 's'}
                                {modeFilter ? ` · ${modeMeta(modeFilter).short} mode` : ''}
                            </p>
                            <div className="wb-admin-arena-grid">
                                {challenges.map((row) => (
                                    <ChallengeCard
                                        key={row.id}
                                        row={row}
                                        onEdit={openEdit}
                                        onToggleActive={toggleActive}
                                        toggling={togglingId}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="wb-admin-dash-empty">
                            <div className="wb-admin-dash-empty-icon" aria-hidden>
                                <NavIcon name="mistakes" />
                            </div>
                            <h2 className="wb-admin-dash-empty-title">No arena challenges yet</h2>
                            <p className="wb-admin-dash-empty-text">
                                Create duels, dailies, and boss quests for learners to earn arena XP.
                            </p>
                            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                                New challenge
                            </button>
                        </div>
                    )}

                    {meta && meta.last_page > 1 && (
                        <div className="wb-admin-pagination">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </button>
                            <span className="small text-muted">
                                Page {meta.current_page} of {meta.last_page}
                            </span>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={page >= meta.last_page}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <AdminArenaChallengeForm
                    form={form}
                    setForm={setForm}
                    programs={programs}
                    saving={saving}
                    editing={editing}
                    onSubmit={handleSubmit}
                    onCancel={closeForm}
                />
            )}
        </div>
    );
}
