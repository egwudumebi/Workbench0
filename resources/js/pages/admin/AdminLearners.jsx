import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminLearners } from '../../api/admin';
import NavIcon from '../../components/ui/NavIcons';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { formatDate } from '../../utils/format';

function learnerInitials(name) {
    if (!name) return '?';
    return name
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function formatLastActive(iso) {
    if (!iso) return 'No activity yet';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 1) return 'Active today';
    if (diffDays === 1) return 'Active yesterday';
    if (diffDays < 14) return `Active ${diffDays}d ago`;
    return formatDate(iso);
}

function LearnerRow({ learner }) {
    const displayName = learner.display_name?.trim() || learner.name;
    const hasEnrolment = learner.enrolments_count > 0;
    const activeCount = learner.active_enrolments ?? 0;

    return (
        <Link to={`/admin/learners/${learner.id}`} className="wb-admin-learner-card">
            <span className="wb-admin-learner-avatar" aria-hidden>
                {learnerInitials(displayName)}
            </span>
            <div className="wb-admin-learner-main">
                <div className="wb-admin-learner-name-row">
                    <span className="wb-admin-learner-name">{displayName}</span>
                    {learner.display_name && learner.display_name !== learner.name ? (
                        <span className="wb-admin-learner-legal text-muted">({learner.name})</span>
                    ) : null}
                </div>
                <span className="wb-admin-learner-email">{learner.email}</span>
            </div>
            <div className="wb-admin-learner-stats">
                <span className="wb-admin-learner-pill">
                    Lv {learner.level ?? 1} · {learner.xp ?? 0} XP
                </span>
                <span
                    className={`wb-admin-learner-pill ${
                        activeCount > 0 ? 'wb-admin-learner-pill--active' : 'wb-admin-learner-pill--muted'
                    }`}
                >
                    {activeCount > 0
                        ? `${activeCount} active programme${activeCount === 1 ? '' : 's'}`
                        : hasEnrolment
                          ? 'No active enrolments'
                          : 'Not enrolled'}
                </span>
            </div>
            <div className="wb-admin-learner-meta">
                <span className="wb-admin-learner-meta-label">Last activity</span>
                <span className="wb-admin-learner-meta-value">{formatLastActive(learner.last_activity_at)}</span>
                <span className="wb-admin-learner-meta-label">Joined</span>
                <span className="wb-admin-learner-meta-value text-muted">{formatDate(learner.created_at)}</span>
            </div>
            <span className="wb-admin-learner-chevron" aria-hidden>
                →
            </span>
        </Link>
    );
}

export default function AdminLearners() {
    const [learners, setLearners] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const response = await fetchAdminLearners({ page, search: search.trim() || undefined });
                if (!cancelled) {
                    setLearners(response.data ?? []);
                    setMeta(response.meta);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) setError(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [page, search]);

    const summary = useMemo(() => {
        if (!meta) return null;
        const onPage = learners.length;
        const activeOnPage = learners.filter((l) => (l.active_enrolments ?? 0) > 0).length;
        return { total: meta.total, onPage, activeOnPage };
    }, [learners, meta]);

    const clearSearch = () => {
        setPage(1);
        setSearch('');
    };

    return (
        <div className="wb-admin-page wb-admin-page--learners">
            <header className="wb-admin-list-hero">
                <div className="wb-admin-list-hero-main">
                    <p className="wb-admin-eyebrow">People</p>
                    <h1 className="wb-admin-dash-title">
                        <span className="wb-admin-dash-title-brand">Workbench</span>
                        <span className="wb-admin-dash-title-dot" aria-hidden>
                            ·
                        </span>
                        <span className="wb-admin-dash-title-role">Learners</span>
                    </h1>
                    <p className="wb-admin-dash-lead">
                        Browse learner accounts, enrolments, and activity—open a dossier to manage programmes or
                        review progress.
                    </p>
                </div>
                {summary && !loading ? (
                    <ul className="wb-admin-dash-hero-kpis" aria-label="Learner counts">
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.total}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Total learners</span>
                        </li>
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.activeOnPage}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Active on page</span>
                        </li>
                    </ul>
                ) : null}
            </header>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <div className="wb-admin-list-toolbar">
                <label className="wb-admin-list-search">
                    <span className="wb-admin-list-search-icon" aria-hidden>
                        ⌕
                    </span>
                    <input
                        type="search"
                        className="form-control"
                        placeholder="Search name or email…"
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                        }}
                        aria-label="Search learners"
                    />
                    {search ? (
                        <button type="button" className="wb-admin-list-search-clear" onClick={clearSearch}>
                            Clear
                        </button>
                    ) : null}
                </label>
                {meta && !loading ? (
                    <p className="wb-admin-list-result-count">
                        {meta.total === 0
                            ? 'No learners'
                            : meta.total === 1
                              ? '1 learner'
                              : `${meta.total} learners`}
                        {search.trim() ? ` matching “${search.trim()}”` : ''}
                    </p>
                ) : null}
            </div>

            {loading ? (
                <LoadingState message="Loading learners…" />
            ) : learners.length > 0 ? (
                <>
                    <div className="wb-admin-learner-list" role="list">
                        {learners.map((learner) => (
                            <div key={learner.id} role="listitem">
                                <LearnerRow learner={learner} />
                            </div>
                        ))}
                    </div>
                    {meta && meta.last_page > 1 ? (
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
                    ) : null}
                </>
            ) : (
                <div className="wb-admin-dash-empty">
                    <div className="wb-admin-dash-empty-icon" aria-hidden>
                        <NavIcon name="skills" />
                    </div>
                    <h2 className="wb-admin-dash-empty-title">
                        {search.trim() ? 'No learners match your search' : 'No learner accounts yet'}
                    </h2>
                    <p className="wb-admin-dash-empty-text">
                        {search.trim()
                            ? 'Try a different name or email, or clear the filter to see everyone.'
                            : 'Learner accounts appear here once users register with the learner role.'}
                    </p>
                    {search.trim() ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={clearSearch}>
                            Clear search
                        </button>
                    ) : (
                        <Link to="/admin/training-programs" className="btn btn-primary btn-sm">
                            Set up programmes
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
