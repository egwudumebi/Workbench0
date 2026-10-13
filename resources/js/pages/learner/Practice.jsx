import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchProjects } from '../../api/projects';
import { fetchNextTask, startSession, submitTask } from '../../api/training';
import FeedbackPanel from '../../components/FeedbackPanel';
import TaskDisplay from '../../components/TaskDisplay';
import TaskForm from '../../components/TaskForm';
import EmptyState from '../../components/ui/EmptyState';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { selectDefaultProject, setStoredProjectId } from '../../utils/projectSelection';

export default function Practice() {
    const [searchParams] = useSearchParams();
    const [projectId, setProjectId] = useState(searchParams.get('project'));
    const [sessionId, setSessionId] = useState(null);
    const [task, setTask] = useState(null);
    const [decision, setDecision] = useState('');
    const [explanation, setExplanation] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [noTasks, setNoTasks] = useState(false);

    const loadTask = useCallback(async (pid, sid) => {
        const response = await fetchNextTask(pid);
        if (!response.data) {
            setNoTasks(true);
            setTask(null);
            return;
        }
        setNoTasks(false);
        setTask(response.data);
        setDecision('');
        setExplanation('');
        setFeedback(null);
        if (!sid) {
            const session = await startSession(pid);
            setSessionId(session.id);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                let pid = searchParams.get('project');
                if (!pid) {
                    const response = await fetchProjects();
                    const selected = selectDefaultProject(response.data);
                    pid = selected?.id;
                }
                if (!pid) {
                    setNoTasks(true);
                    return;
                }
                if (!cancelled) {
                    setProjectId(String(pid));
                    setStoredProjectId(pid);
                }

                const session = await startSession(pid);
                if (!cancelled) setSessionId(session.id);
                await loadTask(pid, session.id);
            } catch (err) {
                if (!cancelled) setError(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [searchParams, loadTask]);

    const handleSubmit = async () => {
        if (!task || !decision) return;
        setSubmitting(true);
        setError(null);
        try {
            const result = await submitTask(task.id, {
                decision,
                explanation,
                training_session_id: sessionId,
            });
            setFeedback(result.evaluation);
        } catch (err) {
            setError(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleNext = async () => {
        setLoading(true);
        setError(null);
        try {
            await loadTask(projectId, sessionId);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="wb-eval-page">
            <header className="wb-eval-page-head">
                <div>
                    <p className="wb-eval-page-eyebrow">Training session</p>
                    <h1 className="wb-eval-page-title">Practice evaluation</h1>
                    <p className="wb-eval-page-sub">Work through tasks with immediate structured feedback.</p>
                </div>
                {sessionId && (
                    <span className="wb-eval-session-pill">Session #{sessionId}</span>
                )}
            </header>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            {noTasks ? (
                <EmptyState
                    title="No tasks available"
                    description="You've completed all available practice tasks for now."
                    action={<Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>}
                />
            ) : task && (
                <div className="wb-eval-layout">
                    <div className="wb-eval-stage-wrap">
                        <div className="wb-eval-stage">
                            <TaskDisplay task={task} variant="studio" />
                        </div>
                    </div>
                    <aside className="wb-eval-console">
                        <div className="wb-eval-console-inner">
                            <h2 className="wb-eval-console-title">Your evaluation</h2>
                            <p className="wb-eval-console-sub">Select a verdict and cite evidence from the responses.</p>
                            <TaskForm
                                task={task}
                                decision={decision}
                                explanation={explanation}
                                onDecisionChange={setDecision}
                                onExplanationChange={setExplanation}
                                disabled={!!feedback || submitting}
                                variant="studio"
                            />

                            {!feedback ? (
                                <button
                                    type="button"
                                    className="btn wb-eval-submit w-100"
                                    onClick={handleSubmit}
                                    disabled={!decision || submitting}
                                >
                                    {submitting ? 'Evaluating…' : 'Submit evaluation'}
                                </button>
                            ) : (
                                <>
                                    <FeedbackPanel evaluation={feedback} />
                                    <button type="button" className="btn wb-eval-submit w-100 mt-3" onClick={handleNext}>
                                        Next task →
                                    </button>
                                </>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
