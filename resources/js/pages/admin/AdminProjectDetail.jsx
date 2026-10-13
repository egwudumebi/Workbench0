import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    fetchAdminProject,
    updateAdminProject,
} from '../../api/admin';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';

export default function AdminProjectDetail() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const loadProject = async () => {
        setLoading(true);
        try {
            setProject(await fetchAdminProject(id));
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProject();
    }, [id]);

    const handleStatusChange = async (status) => {
        setSaving(true);
        setError(null);
        try {
            await updateAdminProject(id, { status });
            await loadProject();
        } catch (err) {
            setError(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingState />;
    if (error && !project) return <ErrorAlert error={error} />;
    if (!project) return null;

    return (
        <div>
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/admin/projects">Projects</Link></li>
                    <li className="breadcrumb-item active">{project.name}</li>
                </ol>
            </nav>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                <div>
                    <h1 className="h3 mb-1">{project.name}</h1>
                    <code className="text-muted">{project.slug}</code>
                </div>
                <div className="d-flex flex-wrap gap-2">
                    <select
                        className="form-select"
                        style={{ width: 160 }}
                        value={project.status}
                        disabled={saving}
                        onChange={(e) => handleStatusChange(e.target.value)}
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                    <Link to={`/admin/tasks?project=${project.id}`} className="btn btn-primary">
                        Manage Tasks
                    </Link>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-md-4">
                    <div className="wb-card p-4 h-100">
                        <div className="text-muted small text-uppercase mb-1">Task Types</div>
                        <div className="display-6 fw-semibold">{project.task_types?.length ?? 0}</div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="wb-card p-4 h-100">
                        <div className="text-muted small text-uppercase mb-1">Skills</div>
                        <div className="display-6 fw-semibold">{project.skills_count ?? 0}</div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="wb-card p-4 h-100">
                        <div className="text-muted small text-uppercase mb-1">Tasks</div>
                        <div className="display-6 fw-semibold">{project.tasks_count ?? 0}</div>
                    </div>
                </div>
            </div>

            {project.description && (
                <div className="wb-card p-4 mb-4">
                    <h2 className="h6 text-muted text-uppercase">Description</h2>
                    <p className="mb-0">{project.description}</p>
                </div>
            )}

            <div className="wb-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h5 mb-0">Task Types</h2>
                    <span className="text-muted small">Tasks render using each type&apos;s schema</span>
                </div>

                {!project.task_types?.length ? (
                    <p className="text-muted mb-0">No task types yet. Projects cloned from the AI Response Evaluation template inherit its task types automatically.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Slug</th>
                                    <th>Decision options</th>
                                    <th>Panels</th>
                                </tr>
                            </thead>
                            <tbody>
                                {project.task_types.map((taskType) => {
                                    const schema = taskType.schema ?? {};
                                    const options = schema.properties?.decision?.enum ?? [];
                                    const panels = Object.entries(schema.display?.panels ?? {})
                                        .filter(([, value]) => value !== false)
                                        .map(([key]) => key.replace(/_/g, ' '))
                                        .join(', ');

                                    return (
                                        <tr key={taskType.id}>
                                            <td className="fw-semibold">{taskType.name}</td>
                                            <td><code>{taskType.slug}</code></td>
                                            <td>{options.join(', ') || '—'}</td>
                                            <td className="text-muted small">{panels || 'default'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
