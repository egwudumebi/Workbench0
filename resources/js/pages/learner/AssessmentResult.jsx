import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAssessmentResult } from '../../api/assessments';
import FeedbackPanel from '../../components/FeedbackPanel';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { formatDate } from '../../utils/format';

export default function AssessmentResult() {
    const { id } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                setResult(await fetchAssessmentResult(id));
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return <LoadingState message="Loading results…" />;
    if (error) return <ErrorAlert error={error} />;
    if (!result) return null;

    const { assessment, submissions } = result;

    return (
        <div>
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                <div>
                    <h1 className="h3 mb-1">Assessment Results</h1>
                    <p className="text-muted mb-0">Assessment #{assessment.id}</p>
                </div>
                <Link to="/dashboard" className="btn btn-outline-primary">Back to Dashboard</Link>
            </div>

            <div className="wb-card p-4 mb-4">
                <div className="row g-4">
                    <div className="col-md-3">
                        <div className="text-muted small">Score</div>
                        <div className="display-6">{assessment.score != null ? `${Math.round(assessment.score)}%` : '—'}</div>
                    </div>
                    <div className="col-md-3">
                        <div className="text-muted small">Result</div>
                        <span className={`badge fs-6 ${assessment.passed ? 'bg-success' : 'bg-danger'}`}>
                            {assessment.passed ? 'Passed' : 'Not Passed'}
                        </span>
                    </div>
                    <div className="col-md-3">
                        <div className="text-muted small">Completed</div>
                        <div>{formatDate(assessment.completed_at)}</div>
                    </div>
                    <div className="col-md-3">
                        <div className="text-muted small">Tasks</div>
                        <div>{assessment.task_count}</div>
                    </div>
                </div>
            </div>

            <h2 className="h5 mb-3">Task Feedback</h2>
            {submissions?.length ? (
                submissions.map((sub, idx) => (
                    <div key={sub.id} className="wb-card p-4 mb-3">
                        <h3 className="h6 mb-3">Task {idx + 1}</h3>
                        <div className="small text-muted mb-2">
                            Your decision: <strong>{sub.answer?.decision}</strong>
                        </div>
                        {sub.answer?.explanation && (
                            <div className="task-panel mb-3 small">{sub.answer.explanation}</div>
                        )}
                        <FeedbackPanel evaluation={sub.evaluation} />
                    </div>
                ))
            ) : (
                <p className="text-muted">No submission details available.</p>
            )}

            <div className="mt-4">
                <Link to="/assessment" className="btn btn-primary me-2">Take Another Assessment</Link>
                <Link to="/practice" className="btn btn-outline-secondary">Continue Practice</Link>
            </div>
        </div>
    );
}
