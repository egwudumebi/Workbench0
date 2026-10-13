import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    createAdminTask,
    fetchAdminProject,
    fetchAdminProjects,
    fetchAdminTasks,
} from '../../api/admin';
import AdminTaskCreateForm from '../../components/admin/AdminTaskCreateForm';
import NavIcon from '../../components/ui/NavIcons';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { formatLabel, lessonExcerpt } from '../../utils/format';

const EMPTY_TASK = {
    title: '',
    task_type_id: '',
    prompt: '',
    response_a: '',
    response_b: '',
    context_notes: '',
    difficulty: 2,
    expected_decision: 'correct',
    expected_explanation: '',
};

function DifficultyMeter({ level }) {
    const n = Number(level) || 0;
    return (
        <div className="wb-admin-task-diff" aria-label={`Difficulty ${n} of 5`}>
            {[1, 2, 3, 4, 5].map((step) => (
                <span key={step} className={step <= n ? 'is-on' : ''} />
            ))}
            <span className="wb-admin-task-diff-label">{n || '—'}</span>
        </div>
    );
}

function TaskCard({ task, showProject }) {
    const prompt = task.current_version?.prompt;
    const excerpt = prompt ? lessonExcerpt(prompt, 100) : '';

    return (
        <article className={`wb-admin-task-card ${task.active ? '' : 'is-inactive'}`}>
            <div className="wb-admin-task-card-head">
                <span className="wb-admin-task-icon" aria-hidden>
                    <NavIcon name="practice" />
                </span>
                <div className="wb-admin-task-main">
                    <h3 className="wb-admin-task-title">{task.title}</h3>
                    <code className="wb-admin-task-slug">{task.slug}</code>
                    {excerpt ? <p className="wb-admin-task-excerpt">{excerpt}</p> : null}
                </div>
                <span
                    className={`wb-admin-task-active ${task.active ? 'is-yes' : 'is-no'}`}
                >
                    {task.active ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div className="wb-admin-task-meta">
                {showProject && task.project?.name ? (
                    <Link to={`/admin/projects/${task.project.id}`} className="wb-admin-task-project-link">
                        {task.project.name}
                    </Link>
                ) : null}
                <span className="wb-admin-task-type">{task.task_type?.name ?? 'Unknown type'}</span>
                <DifficultyMeter level={task.current_version?.difficulty} />
            </div>
        </article>
    );
}

export default function AdminTasks() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [projectDetail, setProjectDetail] = useState(null);
    const projectFilter = searchParams.get('project') ?? '';
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_TASK);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const response = await fetchAdminProjects();
                setProjects(response.data ?? []);
            } catch (err) {
                setError(err);
            }
        })();
    }, []);

    useEffect(() => {
        if (!projectFilter) {
            setProjectDetail(null);
            return;
        }

        (async () => {
            try {
                setProjectDetail(await fetchAdminProject(projectFilter));
            } catch (err) {
                setError(err);
            }
        })();
    }, [projectFilter]);

    const loadTasks = async (p = page, { silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            const params = { page: p };
            if (projectFilter) params.project_id = projectFilter;
            const response = await fetchAdminTasks(params);
            setTasks(response.data ?? []);
            setMeta(response.meta);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks(page);
    }, [page, projectFilter]);

    useEffect(() => {
        if (!showForm || !projectDetail?.task_types?.length || form.task_type_id) {
            return;
        }
        const first = projectDetail.task_types[0];
        const options = first.schema?.properties?.decision?.enum ?? ['correct', 'incorrect'];
        setForm((prev) => ({
            ...prev,
            task_type_id: String(first.id),
            expected_decision: options[0] ?? 'correct',
        }));
    }, [showForm, projectDetail, form.task_type_id]);

    const typeOptions = useMemo(() => {
        const names = new Set(tasks.map((t) => t.task_type?.name).filter(Boolean));
        return ['all', ...Array.from(names).sort()];
    }, [tasks]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return tasks.filter((task) => {
            if (activeFilter === 'active' && !task.active) return false;
            if (activeFilter === 'inactive' && task.active) return false;
            if (typeFilter !== 'all' && task.task_type?.name !== typeFilter) return false;
            if (!q) return true;
            return (
                task.title.toLowerCase().includes(q) ||
                task.slug.toLowerCase().includes(q) ||
                task.task_type?.name?.toLowerCase().includes(q) ||
                task.project?.name?.toLowerCase().includes(q)
            );
        });
    }, [tasks, search, activeFilter, typeFilter]);

    const summary = useMemo(() => {
        const active = tasks.filter((t) => t.active).length;
        const types = new Set(tasks.map((t) => t.task_type?.id).filter(Boolean)).size;
        return {
            total: meta?.total ?? tasks.length,
            onPage: tasks.length,
            active,
            types,
        };
    }, [tasks, meta]);

    const handleProjectChange = (value) => {
        const next = new URLSearchParams(searchParams);
        if (value) {
            next.set('project', value);
        } else {
            next.delete('project');
        }
        setSearchParams(next);
        setPage(1);
        setShowForm(false);
        setForm(EMPTY_TASK);
        setTypeFilter('all');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!projectDetail?.current_version?.id) {
            setError('Select a project with a current version before creating tasks.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await createAdminTask({
                project_id: projectDetail.id,
                project_version_id: projectDetail.current_version.id,
                task_type_id: form.task_type_id,
                title: form.title,
                prompt: form.prompt,
                response_a: form.response_a || null,
                response_b: form.response_b || null,
                context: form.context_notes ? { notes: form.context_notes } : null,
                expected_output: {
                    decision: form.expected_decision,
                    explanation: form.expected_explanation || null,
                },
                difficulty: Number(form.difficulty),
            });
            setShowForm(false);
            setForm(EMPTY_TASK);
            setPage(1);
            await loadTasks(1);
        } catch (err) {
            setError(err);
        } finally {
            setSaving(false);
        }
    };

    const selectedProject = projects.find((p) => String(p.id) === String(projectFilter));

    return (
        <div className="wb-admin-page wb-admin-page--tasks">
            <header className="wb-admin-list-hero">
                <div className="wb-admin-list-hero-main">
                    <p className="wb-admin-eyebrow">Content</p>
                    <h1 className="wb-admin-dash-title">
                        <span className="wb-admin-dash-title-brand">Workbench</span>
                        <span className="wb-admin-dash-title-dot" aria-hidden>
                            ·
                        </span>
                        <span className="wb-admin-dash-title-role">Task bank</span>
                    </h1>
                    <p className="wb-admin-dash-lead">
                        Evaluation items for practice and assessments—scoped by training project and task type schema.
                    </p>
                    {selectedProject ? (
                        <p className="wb-admin-task-domain-link">
                            Domain:{' '}
                            <Link to={`/admin/projects/${selectedProject.id}`}>{selectedProject.name}</Link>
                        </p>
                    ) : null}
                </div>
                {!loading ? (
                    <ul className="wb-admin-dash-hero-kpis" aria-label="Task summary">
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.total}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Tasks{projectFilter ? '' : ' (all)'}</span>
                        </li>
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.active}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Active on page</span>
                        </li>
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.types}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Types on page</span>
                        </li>
                    </ul>
                ) : null}
            </header>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <div className={`wb-admin-task-toolbar ${showForm ? 'is-compact' : ''}`}>
                <label className="wb-admin-task-project-picker">
                    <span className="wb-admin-task-picker-label">Project</span>
                    <select
                        className="form-select"
                        value={projectFilter}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        disabled={showForm}
                    >
                        <option value="">All projects</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </label>

                {!showForm ? (
                    <>
                        <label className="wb-admin-list-search wb-admin-task-search">
                            <span className="wb-admin-list-search-icon" aria-hidden>
                                ⌕
                            </span>
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search title, slug, type…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search tasks"
                            />
                        </label>

                        <div className="wb-admin-ach-filters" role="group" aria-label="Filter by active status">
                            {['all', 'active', 'inactive'].map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    className={`wb-admin-ach-filter ${activeFilter === f ? 'is-active' : ''}`}
                                    onClick={() => setActiveFilter(f)}
                                >
                                    {f === 'all' ? 'All' : formatLabel(f)}
                                </button>
                            ))}
                        </div>

                        {typeOptions.length > 2 ? (
                            <select
                                className="form-select form-select-sm wb-admin-task-type-filter"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                aria-label="Filter by task type"
                            >
                                {typeOptions.map((name) => (
                                    <option key={name} value={name}>
                                        {name === 'all' ? 'All types' : name}
                                    </option>
                                ))}
                            </select>
                        ) : null}

                        <button
                            type="button"
                            className="btn btn-primary wb-admin-task-new-btn"
                            onClick={() => setShowForm(true)}
                            disabled={!projectFilter || !projectDetail?.task_types?.length}
                            title={
                                !projectFilter
                                    ? 'Select a project first'
                                    : !projectDetail?.task_types?.length
                                      ? 'Project has no task types'
                                      : undefined
                            }
                        >
                            New task
                        </button>
                    </>
                ) : (
                    <p className="wb-admin-task-toolbar-focus mb-0">
                        Creating a task for <strong>{projectDetail?.name}</strong>
                    </p>
                )}
            </div>

            {!projectFilter && !showForm && (
                <p className="wb-admin-task-hint">
                    Select a training project to create tasks, or browse all domains below.
                </p>
            )}

            {showForm && projectDetail ? (
                <AdminTaskCreateForm
                    projectDetail={projectDetail}
                    form={form}
                    setForm={setForm}
                    saving={saving}
                    onSubmit={handleCreate}
                    onCancel={() => {
                        setShowForm(false);
                        setForm(EMPTY_TASK);
                    }}
                />
            ) : null}

            {!showForm && loading ? (
                <LoadingState message="Loading tasks…" />
            ) : !showForm && filtered.length > 0 ? (
                <>
                    <p className="wb-admin-list-result-count mb-3">
                        Showing {filtered.length} on this page
                        {meta ? ` · ${meta.total} total in scope` : ''}
                    </p>
                    <div className="wb-admin-task-grid">
                        {filtered.map((task) => (
                            <TaskCard key={task.id} task={task} showProject={!projectFilter} />
                        ))}
                    </div>
                </>
            ) : !showForm ? (
                <div className="wb-admin-dash-empty">
                    <div className="wb-admin-dash-empty-icon" aria-hidden>
                        <NavIcon name="practice" />
                    </div>
                    <h2 className="wb-admin-dash-empty-title">
                        {search.trim() || activeFilter !== 'all' || typeFilter !== 'all'
                            ? 'No tasks match your filters'
                            : projectFilter
                              ? 'No tasks in this project yet'
                              : 'No tasks found'}
                    </h2>
                    <p className="wb-admin-dash-empty-text">
                        {projectFilter
                            ? 'Create the first evaluation item for this domain.'
                            : 'Pick a project from the toolbar or adjust filters.'}
                    </p>
                    {projectFilter && projectDetail?.task_types?.length ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                            New task
                        </button>
                    ) : null}
                </div>
            ) : null}

            {!showForm && meta && meta.last_page > 1 && (
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
