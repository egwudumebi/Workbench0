import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    createAdminLesson,
    createAdminTrainingModule,
    deleteAdminLesson,
    deleteAdminTrainingModule,
    fetchAdminLesson,
    fetchAdminTrainingProgram,
    updateAdminLesson,
    updateAdminTrainingModule,
    updateAdminTrainingProgram,
} from '../../api/admin';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import LessonInteractiveEditor from '../../components/admin/LessonInteractiveEditor';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { useAdminConfirm } from '../../hooks/useAdminConfirm';
import { formatLabel } from '../../utils/format';

const LESSON_STATUSES = ['draft', 'published', 'archived'];

export default function AdminTrainingProgramDetail() {
    const { id } = useParams();
    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingMeta, setSavingMeta] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [addingModule, setAddingModule] = useState(false);
    const [newLessonTitles, setNewLessonTitles] = useState({});
    const [editingLesson, setEditingLesson] = useState(null);
    const [lessonForm, setLessonForm] = useState(null);
    const [lessonDetail, setLessonDetail] = useState(null);
    const [loadingLessonDetail, setLoadingLessonDetail] = useState(false);
    const [savingLesson, setSavingLesson] = useState(false);
    const { confirm, dialog } = useAdminConfirm();

    const reload = useCallback(async () => {
        setProgram(await fetchAdminTrainingProgram(id));
    }, [id]);

    useEffect(() => {
        (async () => {
            try {
                await reload();
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [reload]);

    const saveProgramMeta = async (patch) => {
        setSavingMeta(true);
        try {
            await updateAdminTrainingProgram(id, patch);
            await reload();
        } catch (err) {
            setError(err);
        } finally {
            setSavingMeta(false);
        }
    };

    const handleAddModule = async (e) => {
        e.preventDefault();
        if (!newModuleTitle.trim()) return;
        setAddingModule(true);
        try {
            await createAdminTrainingModule(id, { title: newModuleTitle.trim() });
            setNewModuleTitle('');
            await reload();
        } catch (err) {
            setError(err);
        } finally {
            setAddingModule(false);
        }
    };

    const handleAddLesson = async (moduleId) => {
        const title = newLessonTitles[moduleId]?.trim();
        if (!title) return;
        try {
            await createAdminLesson(moduleId, { title });
            setNewLessonTitles((prev) => ({ ...prev, [moduleId]: '' }));
            await reload();
        } catch (err) {
            setError(err);
        }
    };

    const loadLessonDetail = useCallback(async (lessonId) => {
        setLoadingLessonDetail(true);
        try {
            const detail = await fetchAdminLesson(lessonId);
            setLessonDetail(detail);
            return detail;
        } catch (err) {
            setError(err);
            return null;
        } finally {
            setLoadingLessonDetail(false);
        }
    }, []);

    const openLessonEditor = async (lesson) => {
        setEditingLesson(lesson.id);
        setLessonForm({
            title: lesson.title,
            summary: lesson.summary ?? '',
            content: lesson.content ?? '',
            video_url: lesson.video_url ?? '',
            estimated_minutes: lesson.estimated_minutes ?? 10,
            status: lesson.status ?? 'draft',
        });
        await loadLessonDetail(lesson.id);
    };

    const saveLesson = async () => {
        if (!editingLesson || !lessonForm) return;
        setSavingLesson(true);
        try {
            await updateAdminLesson(editingLesson, {
                ...lessonForm,
                estimated_minutes: Number(lessonForm.estimated_minutes),
            });
            setEditingLesson(null);
            setLessonForm(null);
            setLessonDetail(null);
            await reload();
        } catch (err) {
            setError(err);
        } finally {
            setSavingLesson(false);
        }
    };

    const removeLesson = async (lessonId) => {
        const ok = await confirm({
            title: 'Delete lesson?',
            message: 'Delete this lesson? This cannot be undone.',
            confirmLabel: 'Delete lesson',
            variant: 'danger',
        });
        if (!ok) return;
        try {
            await deleteAdminLesson(lessonId);
            if (editingLesson === lessonId) {
                setEditingLesson(null);
                setLessonForm(null);
            }
            await reload();
        } catch (err) {
            setError(err);
        }
    };

    const removeModule = async (moduleId) => {
        const ok = await confirm({
            title: 'Delete module?',
            message: 'Delete this module and all its lessons? This cannot be undone.',
            confirmLabel: 'Delete module',
            variant: 'danger',
        });
        if (!ok) return;
        try {
            await deleteAdminTrainingModule(moduleId);
            await reload();
        } catch (err) {
            setError(err);
        }
    };

    if (loading) return <LoadingState message="Loading programme…" />;
    if (!program) return null;

    return (
        <div className="wb-admin-page">
            <nav className="wb-admin-crumb mb-3">
                <Link to="/admin/training-programs">Programmes</Link>
                <span aria-hidden> / </span>
                <span>{program.name}</span>
            </nav>

            <AdminPageHeader
                eyebrow="Programme editor"
                title={program.name}
                subtitle={program.description?.slice(0, 160) ?? 'Edit campaign metadata, modules, and lessons.'}
            />

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <section className="wb-admin-panel mb-4">
                <h2 className="h6 fw-bold mb-3">Campaign settings</h2>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">Name</label>
                        <input
                            className="form-control"
                            defaultValue={program.name}
                            onBlur={(e) => {
                                if (e.target.value !== program.name) {
                                    saveProgramMeta({ name: e.target.value });
                                }
                            }}
                            disabled={savingMeta}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={program.status}
                            onChange={(e) => saveProgramMeta({ status: e.target.value })}
                            disabled={savingMeta}
                        >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div className="col-md-3 d-flex align-items-end">
                        <label className="d-flex align-items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                checked={!!program.featured}
                                onChange={(e) => saveProgramMeta({ featured: e.target.checked })}
                                disabled={savingMeta}
                            />
                            Featured campaign
                        </label>
                    </div>
                    <div className="col-12">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            rows={3}
                            defaultValue={program.description ?? ''}
                            onBlur={(e) => {
                                if (e.target.value !== (program.description ?? '')) {
                                    saveProgramMeta({ description: e.target.value });
                                }
                            }}
                            disabled={savingMeta}
                        />
                    </div>
                    {program.project && (
                        <div className="col-12">
                            <span className="small text-muted">
                                Linked project: <strong>{program.project.name}</strong>
                            </span>
                        </div>
                    )}
                </div>
            </section>

            <section className="wb-admin-section">
                <h2 className="wb-admin-section-title">Modules &amp; lessons</h2>

                <form className="d-flex gap-2 mb-4" onSubmit={handleAddModule}>
                    <input
                        className="form-control"
                        placeholder="New module title…"
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={addingModule}>
                        {addingModule ? 'Adding…' : 'Add module'}
                    </button>
                </form>

                {(program.modules ?? []).map((module) => (
                    <article key={module.id} className="wb-admin-module-block mb-3">
                        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                            <div>
                                <h3 className="h6 fw-bold mb-0">{module.title}</h3>
                                {module.description && (
                                    <p className="small text-muted mb-0">{module.description}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeModule(module.id)}
                            >
                                Delete module
                            </button>
                        </div>

                        <ul className="wb-admin-lesson-list mb-2">
                            {(module.lessons ?? []).map((lesson) => (
                                <li key={lesson.id}>
                                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 text-start text-decoration-none fw-semibold"
                                            onClick={() => openLessonEditor(lesson)}
                                        >
                                            {lesson.title}
                                        </button>
                                        <span className="small text-muted">
                                            {formatLabel(lesson.status)} · {lesson.estimated_minutes ?? '—'} min
                                            {lesson.video_url ? ' · 🎬' : ''}
                                        </span>
                                    </div>
                                </li>
                            ))}
                            {!module.lessons?.length && (
                                <li className="text-muted small">No lessons in this module yet.</li>
                            )}
                        </ul>

                        <div className="d-flex gap-2">
                            <input
                                className="form-control form-control-sm"
                                placeholder="New lesson title…"
                                value={newLessonTitles[module.id] ?? ''}
                                onChange={(e) =>
                                    setNewLessonTitles((prev) => ({ ...prev, [module.id]: e.target.value }))
                                }
                            />
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleAddLesson(module.id)}
                            >
                                Add lesson
                            </button>
                        </div>
                    </article>
                ))}

                {!program.modules?.length && (
                    <p className="text-muted">Add a module to start building the learning path.</p>
                )}
            </section>

            {editingLesson && lessonForm && (
                <section className="wb-admin-panel wb-admin-lesson-editor">
                    <h2 className="h6 fw-bold mb-3">Edit lesson</h2>
                    <div className="row g-3">
                        <div className="col-md-8">
                            <label className="form-label">Title</label>
                            <input
                                className="form-control"
                                value={lessonForm.title}
                                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={lessonForm.status}
                                onChange={(e) => setLessonForm({ ...lessonForm, status: e.target.value })}
                            >
                                {LESSON_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {formatLabel(s)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12">
                            <label className="form-label">Summary</label>
                            <input
                                className="form-control"
                                value={lessonForm.summary}
                                onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })}
                            />
                        </div>
                        <div className="col-md-8">
                            <label className="form-label">Video URL</label>
                            <input
                                className="form-control"
                                value={lessonForm.video_url}
                                onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                                placeholder="https://…"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Est. minutes</label>
                            <input
                                type="number"
                                min={1}
                                className="form-control"
                                value={lessonForm.estimated_minutes}
                                onChange={(e) =>
                                    setLessonForm({ ...lessonForm, estimated_minutes: e.target.value })
                                }
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Content (Markdown)</label>
                            <textarea
                                className="form-control font-monospace small"
                                rows={12}
                                value={lessonForm.content}
                                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                            />
                        </div>
                        <div className="col-12 d-flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={saveLesson}
                                disabled={savingLesson}
                            >
                                {savingLesson ? 'Saving…' : 'Save lesson'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => removeLesson(editingLesson)}
                            >
                                Delete lesson
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    setEditingLesson(null);
                                    setLessonForm(null);
                                    setLessonDetail(null);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    {loadingLessonDetail && (
                        <p className="small text-muted mt-3 mb-0">Loading checkpoints &amp; quiz…</p>
                    )}
                    {!loadingLessonDetail && lessonDetail && (
                        <LessonInteractiveEditor
                            lessonId={editingLesson}
                            lessonDetail={lessonDetail}
                            onReload={() => loadLessonDetail(editingLesson)}
                        />
                    )}
                </section>
            )}
            {dialog}
        </div>
    );
}
