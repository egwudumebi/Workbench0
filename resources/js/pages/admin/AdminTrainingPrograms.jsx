import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminTrainingPrograms, updateAdminTrainingProgram } from '../../api/admin';
import NavIcon from '../../components/ui/NavIcons';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { formatLabel, lessonExcerpt } from '../../utils/format';

const STATUS_FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'published', label: 'Published' },
    { id: 'draft', label: 'Draft' },
    { id: 'archived', label: 'Archived' },
];

const STATUS_OPTIONS = ['published', 'draft', 'archived'];

function ProgramStatusPill({ status }) {
    const normalized = (status ?? 'draft').toLowerCase();
    return (
        <span className={`wb-admin-program-status wb-admin-program-status--${normalized}`}>
            {formatLabel(status)}
        </span>
    );
}

function ProgramCard({ program, onStatusChange, onFeaturedToggle, statusBusy, featuredBusy }) {
    const description = lessonExcerpt(program.description, 140);
    const busy = statusBusy === program.id || featuredBusy === program.id;

    return (
        <article className="wb-admin-program-card">
            <Link to={`/admin/training-programs/${program.id}`} className="wb-admin-program-card-link">
                <span className="wb-admin-program-icon" aria-hidden>
                    <NavIcon name="lessons" />
                </span>
                <div className="wb-admin-program-main">
                    <div className="wb-admin-program-name-row">
                        <h3 className="wb-admin-program-name">{program.name}</h3>
                        {program.featured ? (
                            <span className="wb-admin-program-featured-badge">Featured</span>
                        ) : null}
                    </div>
                    {description ? <p className="wb-admin-program-desc">{description}</p> : null}
                    <code className="wb-admin-program-slug">{program.slug}</code>
                    {program.project ? (
                        <p className="wb-admin-program-project mb-0">Domain: {program.project.name}</p>
                    ) : null}
                    <ul className="wb-admin-program-stats" aria-label="Programme stats">
                        <li>{program.modules_count ?? 0} modules</li>
                        <li>{program.lessons_count ?? 0} lessons</li>
                        <li>{program.enrolments_count ?? 0} enrolments</li>
                    </ul>
                </div>
                <ProgramStatusPill status={program.status} />
            </Link>

            <div className="wb-admin-program-actions">
                <Link to={`/admin/training-programs/${program.id}`} className="btn btn-sm btn-primary">
                    Edit path
                </Link>
                {program.project ? (
                    <Link to={`/admin/projects/${program.project.id}`} className="btn btn-sm btn-outline-secondary">
                        Domain
                    </Link>
                ) : null}
                <Link
                    to="/admin/learners"
                    className="btn btn-sm btn-outline-secondary"
                    title="Manage enrolments from learner dossiers"
                >
                    Enrolments
                </Link>
                <div className="wb-admin-program-status-picker" role="group" aria-label={`Status for ${program.name}`}>
                    {STATUS_OPTIONS.map((status) => (
                        <button
                            key={status}
                            type="button"
                            className={`wb-admin-program-status-option ${
                                program.status === status ? 'is-selected' : ''
                            }`}
                            disabled={busy}
                            aria-pressed={program.status === status}
                            onClick={() => onStatusChange(program, status)}
                        >
                            {formatLabel(status)}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className={`btn btn-sm wb-admin-program-featured-btn ${program.featured ? 'is-on' : 'btn-outline-secondary'}`}
                    disabled={busy}
                    onClick={() => onFeaturedToggle(program)}
                    aria-pressed={program.featured}
                >
                    {program.featured ? '★ Featured' : '☆ Feature'}
                </button>
            </div>
        </article>
    );
}

export default function AdminTrainingPrograms() {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [statusBusy, setStatusBusy] = useState(null);
    const [featuredBusy, setFeaturedBusy] = useState(null);

    const load = async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            setPrograms(await fetchAdminTrainingPrograms());
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

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return programs.filter((p) => {
            if (statusFilter !== 'all' && p.status !== statusFilter) return false;
            if (!q) return true;
            return (
                p.name.toLowerCase().includes(q) ||
                p.slug.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.project?.name?.toLowerCase().includes(q)
            );
        });
    }, [programs, search, statusFilter]);

    const summary = useMemo(() => {
        const published = programs.filter((p) => p.status === 'published').length;
        const enrolments = programs.reduce((sum, p) => sum + (p.enrolments_count ?? 0), 0);
        const lessons = programs.reduce((sum, p) => sum + (p.lessons_count ?? 0), 0);
        return { total: programs.length, published, enrolments, lessons };
    }, [programs]);

    const handleStatus = async (program, status) => {
        if (status === program.status) return;
        setStatusBusy(program.id);
        try {
            await updateAdminTrainingProgram(program.id, { status });
            await load({ silent: true });
        } catch (err) {
            setError(err);
        } finally {
            setStatusBusy(null);
        }
    };

    const handleFeatured = async (program) => {
        setFeaturedBusy(program.id);
        try {
            await updateAdminTrainingProgram(program.id, { featured: !program.featured });
            await load({ silent: true });
        } catch (err) {
            setError(err);
        } finally {
            setFeaturedBusy(null);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
    };

    const hasFilters = Boolean(search.trim() || statusFilter !== 'all');

    return (
        <div className="wb-admin-page wb-admin-page--programs">
            <header className="wb-admin-list-hero wb-admin-list-hero--programmes">
                <div className="wb-admin-list-hero-main">
                    <p className="wb-admin-eyebrow">Content</p>
                    <h1 className="wb-admin-dash-title">
                        <span className="wb-admin-dash-title-brand">Workbench</span>
                        <span className="wb-admin-dash-title-dot" aria-hidden>
                            ·
                        </span>
                        <span className="wb-admin-dash-title-role">Programmes</span>
                    </h1>
                    <p className="wb-admin-dash-lead">
                        Academy campaigns learners enrol in—modules, lessons, publish state, and featured placement on
                        the hub.
                    </p>
                </div>
                {!loading && programs.length > 0 ? (
                    <ul className="wb-admin-dash-hero-kpis" aria-label="Programme summary">
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.total}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Programmes</span>
                        </li>
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.published}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Published</span>
                        </li>
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.enrolments}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Enrolments</span>
                        </li>
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.lessons}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Lessons total</span>
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
                        placeholder="Search name, slug, or domain…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search programmes"
                    />
                    {search ? (
                        <button type="button" className="wb-admin-list-search-clear" onClick={() => setSearch('')}>
                            Clear
                        </button>
                    ) : null}
                </label>

                <div className="wb-admin-program-filters" role="group" aria-label="Filter by status">
                    {STATUS_FILTERS.map((filter) => (
                        <button
                            key={filter.id}
                            type="button"
                            className={`wb-admin-program-filter-pill ${statusFilter === filter.id ? 'is-active' : ''}`}
                            onClick={() => setStatusFilter(filter.id)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {!loading ? (
                <p className="wb-admin-list-result-count">
                    {filtered.length === 0
                        ? 'No programmes'
                        : filtered.length === 1
                          ? '1 programme'
                          : `${filtered.length} programmes`}
                    {hasFilters ? ' matching filters' : ''}
                </p>
            ) : null}

            {loading ? (
                <LoadingState message="Loading programmes…" />
            ) : filtered.length > 0 ? (
                <div className="wb-admin-program-list">
                    {filtered.map((p) => (
                        <ProgramCard
                            key={p.id}
                            program={p}
                            onStatusChange={handleStatus}
                            onFeaturedToggle={handleFeatured}
                            statusBusy={statusBusy}
                            featuredBusy={featuredBusy}
                        />
                    ))}
                </div>
            ) : (
                <div className="wb-admin-dash-empty">
                    <div className="wb-admin-dash-empty-icon" aria-hidden>
                        <NavIcon name="lessons" />
                    </div>
                    <h2 className="wb-admin-dash-empty-title">
                        {hasFilters ? 'No programmes match your filters' : 'No training programmes yet'}
                    </h2>
                    <p className="wb-admin-dash-empty-text">
                        {hasFilters
                            ? 'Try another search or status filter, or clear filters to see all campaigns.'
                            : 'Programmes are seeded with training projects—check your database seeders or create structure from a project domain.'}
                    </p>
                    {hasFilters ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={clearFilters}>
                            Clear filters
                        </button>
                    ) : (
                        <Link to="/admin/projects" className="btn btn-primary btn-sm">
                            View training projects
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
