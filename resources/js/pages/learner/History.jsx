import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHistory } from '../../api/training';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, formatLabel, formatScore } from '../../utils/format';

export default function History() {
    const [submissions, setSubmissions] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        (async () => {
            try {
                const response = await fetchHistory(page);
                setSubmissions(Array.isArray(response.data) ? response.data : Object.values(response.data ?? {}));
                setMeta(response.meta);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [page]);

    if (loading) return <LoadingState message="Loading history…" />;
    if (error) return <ErrorAlert error={error} />;

    return (
        <div>
            <PageHeader
                title="Training History"
                subtitle="Review your past practice and assessment submissions."
                actions={
                    <Link to="/practice" className="btn btn-primary">
                        Continue Practice
                    </Link>
                }
            />

            {!submissions.length ? (
                <EmptyState
                    title="No submissions yet"
                    description="Your practice submissions will appear here."
                    action={<Link to="/practice" className="btn btn-primary">Start Practice</Link>}
                />
            ) : (
                <>
                    <div className="d-none d-md-block wb-card wb-history-table-wrap mb-4">
                        <div className="table-responsive">
                            <table className="table table-hover wb-history-table mb-0">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Task</th>
                                        <th>Mode</th>
                                        <th>Decision</th>
                                        <th>Score</th>
                                        <th>Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((sub) => (
                                        <HistoryRow key={sub.id} submission={sub} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="d-md-none d-flex flex-column gap-3 mb-4">
                        {submissions.map((sub) => (
                            <HistoryCard key={sub.id} submission={sub} />
                        ))}
                    </div>

                    {meta?.total != null && (
                        <p className="text-muted small mb-3">
                            Showing page {meta.current_page} of {meta.last_page} · {meta.total} total submissions
                        </p>
                    )}

                    <Pagination
                        page={page}
                        lastPage={meta?.last_page}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    );
}

function HistoryRow({ submission: sub }) {
    return (
        <tr>
            <td className="text-nowrap">{formatDate(sub.submitted_at)}</td>
            <td className="wb-history-task">{sub.task_title ?? `Task #${sub.task_version_id}`}</td>
            <td><ModeBadge mode={sub.mode} /></td>
            <td>{formatLabel(sub.answer?.decision) || '—'}</td>
            <td className="fw-semibold">{formatScore(sub.evaluation?.score)}</td>
            <td><ResultBadge evaluation={sub.evaluation} /></td>
        </tr>
    );
}

function HistoryCard({ submission: sub }) {
    return (
        <div className="wb-history-card wb-card p-3">
            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                <div>
                    <div className="fw-semibold">{sub.task_title ?? `Task #${sub.task_version_id}`}</div>
                    <div className="small text-muted">{formatDate(sub.submitted_at)}</div>
                </div>
                <ResultBadge evaluation={sub.evaluation} />
            </div>
            <div className="d-flex flex-wrap gap-2 align-items-center">
                <ModeBadge mode={sub.mode} />
                <span className="small text-muted">
                    Decision: <strong>{formatLabel(sub.answer?.decision) || '—'}</strong>
                </span>
                <span className="small ms-auto fw-semibold">
                    {formatScore(sub.evaluation?.score)}
                </span>
            </div>
        </div>
    );
}

function ModeBadge({ mode }) {
    const isAssessment = mode === 'assessment';
    return (
        <span className={`badge ${isAssessment ? 'bg-dark' : 'bg-light text-dark border'}`}>
            {formatLabel(mode)}
        </span>
    );
}

function ResultBadge({ evaluation }) {
    if (!evaluation) {
        return <span className="badge bg-secondary">Pending</span>;
    }

    return (
        <span className={`badge ${evaluation.passed ? 'wb-badge-ready' : 'wb-badge-not-ready'}`}>
            {evaluation.passed ? 'Passed' : 'Failed'}
        </span>
    );
}
