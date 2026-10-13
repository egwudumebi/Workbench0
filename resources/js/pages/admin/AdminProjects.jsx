import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createAdminProject, fetchAdminProjects, updateAdminProject } from '../../api/admin';
import NavIcon from '../../components/ui/NavIcons';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { formatLabel, lessonExcerpt } from '../../utils/format';

const TEMPLATE_OPTIONS = [
    { slug: 'ai-response-evaluation', label: 'AI Response Evaluation (full template)' },
    { slug: '', label: 'Empty (no template)' },
];

const STATUS_FILTERS = ['all', 'active', 'draft', 'archived'];

function ProjectStatusPill({ status }) {
    const normalized = (status ?? '').toLowerCase();
    return (
        <span className={`wb-admin-project-status wb-admin-project-status--${normalized}`}>
            {formatLabel(status)}
        </span>
    );
}

function ProjectCard({ project, onStatusChange, statusBusy }) {
    const description = lessonExcerpt(project.description, 120);

    return (
        <article className="wb-admin-project-card">
            <Link to={`/admin/projects/${project.id}`} className="wb-admin-project-card-link">
                <span className="wb-admin-project-icon" aria-hidden>
                    <NavIcon name="projects" />
                </span>
                <div className="wb-admin-project-main">
                    <h3 className="wb-admin-project-name">{project.name}</h3>
                    {description ? <p className="wb-admin-project-desc">{description}</p> : null}
                    <code className="wb-admin-project-slug">{project.slug}</code>
                    <ul className="wb-admin-project-stats" aria-label="Domain stats">
                        <li>{project.task_types_count ?? 0} task types</li>
                        <li>{project.tasks_count ?? 0} tasks</li>
                        <li>{project.skills_count ?? 0} skills</li>
                        <li>{project.training_programs_count ?? 0} programmes</li>
                    </ul>
                </div>
                <ProjectStatusPill status={project.status} />
            </Link>

            <div className="wb-admin-project-actions">
                <Link to={`/admin/projects/${project.id}`} className="btn btn-sm btn-primary">
                    Manage domain
                </Link>
                <Link to={`/admin/tasks?project=${project.id}`} className="btn btn-sm btn-outline-secondary">
                    Task bank
                </Link>
                <label className="wb-admin-project-status-select">
                    <span className="visually-hidden">Change status for {project.name}</span>
                    <select
                        className="form-select form-select-sm"
                        value={project.status}
                        disabled={statusBusy === project.id}
                        onChange={(e) => onStatusChange(project, e.target.value)}
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                </label>
            </div>
        </article>
    );
}

export default function AdminProjects() {
    const [projects, setProjects] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [statusBusy, setStatusBusy] = useState(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        instructions: '',
        status: 'draft',
        template_slug: 'ai-response-evaluation',
    });
    const [saving, setSaving] = useState(false);

    const loadProjects = async (p = page, { silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            const response = await fetchAdminProjects(p);
            setProjects(response.data ?? []);
            setMeta(response.meta);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects(page);
    }, [page]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return projects.filter((project) => {
            if (statusFilter !== 'all' && project.status !== statusFilter) {
                return false;
            }
            if (!q) return true;
            return (
                project.name.toLowerCase().includes(q) ||
                project.slug.toLowerCase().includes(q) ||
                project.description?.toLowerCase().includes(q)
            );
        });
    }, [projects, search, statusFilter]);

    const summary = useMemo(() => {
        const active = projects.filter((p) => p.status === 'active').length;
        const tasks = projects.reduce((sum, p) => sum + (p.tasks_count ?? 0), 0);
        return {
            total: meta?.total ?? projects.length,
            active,
            tasks,
        };
    }, [projects, meta]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await createAdminProject({
                ...form,
                template_slug: form.template_slug || null,
            });
            setShowForm(false);
            setForm({
                name: '',
                description: '',
                instructions: '',
                status: 'draft',
                template_slug: 'ai-response-evaluation',
            });
            setPage(1);
            await loadProjects(1);
        } catch (err) {
            setError(err);
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (project, status) => {
        if (status === project.status) return;
        setStatusBusy(project.id);
        setError(null);
        try {
            await updateAdminProject(project.id, { status });
            await loadProjects(page, { silent: true });
        } catch (err) {
            setError(err);
        } finally {
            setStatusBusy(null);
        }
    };

    return (
        <div className="wb-admin-page wb-admin-page--projects">
            <header className="wb-admin-list-hero">
                <div className="wb-admin-list-hero-main">
                    <p className="wb-admin-eyebrow">Content</p>
                    <h1 className="wb-admin-dash-title">
                        <span className="wb-admin-dash-title-brand">Workbench</span>
                        <span className="wb-admin-dash-title-dot" aria-hidden>
                            ·
                        </span>
                        <span className="wb-admin-dash-title-role">Training projects</span>
                    </h1>
                    <p className="wb-admin-dash-lead">
                        Evaluation domains with rubrics, versions, and task types—the foundation learners practice and
                        get assessed on.
                    </p>
                </div>
                <div className="wb-admin-project-hero-actions">
                    {!loading && projects.length > 0 ? (
                        <ul className="wb-admin-dash-hero-kpis" aria-label="Project summary">
                            <li>
                                <span className="wb-admin-dash-hero-kpi-value">{summary.total}</span>
                                <span className="wb-admin-dash-hero-kpi-label">Domains</span>
                            </li>
                            <li>
                                <span className="wb-admin-dash-hero-kpi-value">{summary.active}</span>
                                <span className="wb-admin-dash-hero-kpi-label">Active</span>
                            </li>
                            <li>
                                <span className="wb-admin-dash-hero-kpi-value">{summary.tasks}</span>
                                <span className="wb-admin-dash-hero-kpi-label">Tasks total</span>
                            </li>
                        </ul>
                    ) : null}
                    <button
                        type="button"
                        className="btn btn-primary wb-admin-project-new-btn"
                        onClick={() => setShowForm((v) => !v)}
                    >
                        {showForm ? 'Close form' : 'New project'}
                    </button>
                </div>
            </header>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            {showForm && (
                <form onSubmit={handleCreate} className="wb-admin-project-create">
                    <h2 className="wb-admin-project-create-title">Create training project</h2>
                    <p className="wb-admin-project-create-lead">
                        Bootstrap rubrics and task types from a template, or start empty and configure manually.
                    </p>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Name</label>
                            <input
                                className="form-control"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Initial status</label>
                            <select
                                className="form-select"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div className="col-12">
                            <label className="form-label">Template</label>
                            <select
                                className="form-select"
                                value={form.template_slug}
                                onChange={(e) => setForm({ ...form, template_slug: e.target.value })}
                            >
                                {TEMPLATE_OPTIONS.map((option) => (
                                    <option key={option.slug || 'empty'} value={option.slug}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <div className="form-text">
                                Cloning from AI Response Evaluation copies task types, skills, and rubric structure.
                            </div>
                        </div>
                        <div className="col-12">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-control"
                                rows={2}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Instructions</label>
                            <textarea
                                className="form-control"
                                rows={3}
                                value={form.instructions}
                                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                            />
                        </div>
                        <div className="col-12 d-flex flex-wrap gap-2">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Creating…' : 'Create project'}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="wb-admin-project-toolbar">
                <label className="wb-admin-list-search">
                    <span className="wb-admin-list-search-icon" aria-hidden>
                        ⌕
                    </span>
                    <input
                        type="search"
                        className="form-control"
                        placeholder="Search projects…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search training projects"
                    />
                </label>
                <div className="wb-admin-ach-filters" role="group" aria-label="Filter by status">
                    {STATUS_FILTERS.map((status) => (
                        <button
                            key={status}
                            type="button"
                            className={`wb-admin-ach-filter ${statusFilter === status ? 'is-active' : ''}`}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status === 'all' ? 'All' : formatLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <LoadingState message="Loading training projects…" />
            ) : filtered.length > 0 ? (
                <>
                    <p className="wb-admin-list-result-count mb-3">
                        Showing {filtered.length} on this page
                        {meta ? ` · ${meta.total} total domains` : ''}
                    </p>
                    <div className="wb-admin-project-grid">
                        {filtered.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onStatusChange={handleStatusChange}
                                statusBusy={statusBusy}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="wb-admin-dash-empty">
                    <div className="wb-admin-dash-empty-icon" aria-hidden>
                        <NavIcon name="projects" />
                    </div>
                    <h2 className="wb-admin-dash-empty-title">
                        {search.trim() || statusFilter !== 'all'
                            ? 'No projects match your filters'
                            : 'No training projects yet'}
                    </h2>
                    <p className="wb-admin-dash-empty-text">
                        {search.trim() || statusFilter !== 'all'
                            ? 'Clear filters or create a new domain below.'
                            : 'Create your first evaluation domain to wire up task types and rubrics.'}
                    </p>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                        New project
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
        </div>
    );
}
