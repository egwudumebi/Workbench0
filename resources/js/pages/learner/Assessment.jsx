import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    createAssessment,
    fetchAssessment,
    fetchCurrentAssessment,
    submitAssessmentTask,
    finalizeAssessment,
} from '../../api/assessments';
import { fetchProjects } from '../../api/projects';
import TaskDisplay from '../../components/TaskDisplay';
import TaskForm from '../../components/TaskForm';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { selectDefaultProject, setStoredProjectId } from '../../utils/projectSelection';
import AssessmentIntegrityGate from '../../components/academy/AssessmentIntegrityGate';

export default function Assessment() {
    const { id: routeId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const assessmentId = routeId ?? searchParams.get('id');
    const projectParam = searchParams.get('project');

    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [decision, setDecision] = useState('');
    const [explanation, setExplanation] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [error, setError] = useState(null);
    const [integrityReady, setIntegrityReady] = useState(false);
    const [pendingStart, setPendingStart] = useState(false);

    useEffect(() => {
        if (!integrityReady || assessmentId) return undefined;

        let cancelled = false;

        const applyAssessment = (data) => {
            if (cancelled) return;

            if (data.status === 'completed') {
                navigate(`/assessment/${data.id}/result`, { replace: true });
                return;
            }

            setAssessment(data);
            const tasks = normalizeList(data.tasks);
            const submittedIds = normalizeList(data.submitted_task_version_ids);
            const firstUnsubmitted = tasks.findIndex((t) => !submittedIds.includes(t.id));
            setCurrentIndex(firstUnsubmitted >= 0 ? firstUnsubmitted : 0);
        };

        (async () => {
            try {
                if (assessmentId) {
                    applyAssessment(await fetchAssessment(assessmentId));
                    return;
                }

                if (!pendingStart) return;

                let pid = projectParam;
                if (!pid) {
                    const response = await fetchProjects();
                    const selected = selectDefaultProject(response.data);
                    pid = selected?.id;
                }
                if (!pid) {
                    setError('No project available for assessment.');
                    return;
                }
                setStoredProjectId(pid);

                const current = await fetchCurrentAssessment(pid);
                if (current) {
                    applyAssessment(current);
                    navigate(`/assessment/${current.id}`, { replace: true });
                    return;
                }

                const created = await createAssessment(pid);
                applyAssessment(created);
                navigate(`/assessment/${created.id}`, { replace: true });
            } catch (err) {
                if (!cancelled) setError(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [assessmentId, projectParam, navigate, integrityReady, pendingStart]);

    useEffect(() => {
        if (!assessmentId) {
            setPendingStart(true);
        } else {
            setIntegrityReady(true);
        }
    }, [assessmentId]);

    const tasks = normalizeList(assessment?.tasks);
    const submittedIds = normalizeList(assessment?.submitted_task_version_ids);
    const currentTask = tasks[currentIndex];
    const isSubmitted = currentTask ? submittedIds.includes(currentTask.id) : false;
    const allSubmitted = tasks.length > 0 && tasks.every((t) => submittedIds.includes(t.id));
    const progress = tasks.length ? Math.round((submittedIds.length / tasks.length) * 100) : 0;
    const isResuming = submittedIds.length > 0 && !allSubmitted;

    const handleSubmit = async () => {
        if (!assessment || !currentTask || !decision) return;
        setSubmitting(true);
        setError(null);
        try {
            await submitAssessmentTask(assessment.id, currentTask.id, { decision, explanation });
            const updated = await fetchAssessment(assessment.id);
            setAssessment(updated);

            const updatedTasks = normalizeList(updated.tasks);
            const updatedSubmittedIds = normalizeList(updated.submitted_task_version_ids);
            setDecision('');
            setExplanation('');

            const nextIndex = updatedTasks.findIndex(
                (t) => !updatedSubmittedIds.includes(t.id),
            );
            if (nextIndex >= 0) {
                setCurrentIndex(nextIndex);
            }
        } catch (err) {
            setError(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinalize = async () => {
        if (!assessment) return;
        setFinalizing(true);
        setError(null);
        try {
            await finalizeAssessment(assessment.id);
            navigate(`/assessment/${assessment.id}/result`);
        } catch (err) {
            setError(err);
        } finally {
            setFinalizing(false);
        }
    };

    const taskNav = useMemo(
        () =>
            tasks.map((task, idx) => ({
                task,
                idx,
                done: submittedIds.includes(task.id),
            })),
        [tasks, submittedIds],
    );

    if (!assessmentId && !integrityReady) {
        return (
            <div>
                <h1 className="h3 mb-4">Assessment</h1>
                <AssessmentIntegrityGate onReady={() => setIntegrityReady(true)} />
            </div>
        );
    }

    if (loading) return <LoadingState message="Preparing assessment…" />;
    if (error && !assessment) return <ErrorAlert error={error} />;

    return (
        <div>
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                <div>
                    <h1 className="h3 mb-1">Assessment</h1>
                    <p className="text-muted mb-0">
                        Complete all tasks before finalizing. Feedback is hidden until you finish.
                    </p>
                </div>
                {assessment && (
                    <div className="text-end">
                        <span className="badge bg-light text-dark border me-2">
                            {submittedIds.length} / {tasks.length} submitted
                        </span>
                        <span className="badge bg-secondary">{assessment.status}</span>
                    </div>
                )}
            </div>

            {isResuming && (
                <div className="alert alert-info">
                    Welcome back — pick up where you left off. Your previous responses are saved.
                </div>
            )}

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            {assessment && (
                <>
                    <div className="progress mb-4" style={{ height: 8 }}>
                        <div className="progress-bar" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-4">
                        {taskNav.map(({ task, idx, done }) => (
                            <button
                                key={task.id}
                                type="button"
                                className={`btn btn-sm ${idx === currentIndex ? 'btn-primary' : done ? 'btn-success' : 'btn-outline-secondary'}`}
                                onClick={() => {
                                    setCurrentIndex(idx);
                                    setDecision('');
                                    setExplanation('');
                                }}
                            >
                                Task {idx + 1}
                            </button>
                        ))}
                    </div>

                    {currentTask && (
                        <div className="row g-4">
                            <div className="col-lg-7">
                                <div className="wb-card p-4">
                                    <TaskDisplay task={currentTask} />
                                </div>
                            </div>
                            <div className="col-lg-5">
                                <div className="wb-card p-4">
                                    <h2 className="h5 mb-3">
                                        Task {currentIndex + 1} of {tasks.length}
                                    </h2>

                                    {isSubmitted ? (
                                        <div className="alert alert-success">
                                            Response submitted. Select another task or finalize when ready.
                                        </div>
                                    ) : (
                                        <>
                                            <TaskForm
                                                task={currentTask}
                                                decision={decision}
                                                explanation={explanation}
                                                onDecisionChange={setDecision}
                                                onExplanationChange={setExplanation}
                                                disabled={submitting}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-primary w-100"
                                                onClick={handleSubmit}
                                                disabled={!decision || submitting}
                                            >
                                                {submitting ? 'Submitting…' : 'Submit Response'}
                                            </button>
                                        </>
                                    )}

                                    {allSubmitted && (
                                        <button
                                            type="button"
                                            className="btn btn-success w-100 mt-3"
                                            onClick={handleFinalize}
                                            disabled={finalizing}
                                        >
                                            {finalizing ? 'Finalizing…' : 'Finalize Assessment'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!tasks.length && (
                        <div className="alert alert-info">
                            No assessment tasks available. <Link to="/dashboard">Return to dashboard</Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function normalizeList(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
}
