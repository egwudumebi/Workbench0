import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMistakes } from '../../api/progress';
import { useDefaultProject } from '../../hooks/useDefaultProject';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import { formatLabel, mistakeSeverityClass } from '../../utils/format';

export default function Mistakes() {
    const { project, projectId, loading: projectLoading, error: projectError } = useDefaultProject();
    const [mistakes, setMistakes] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!projectId) return;

        setLoading(true);
        (async () => {
            try {
                const response = await fetchMistakes(projectId, page);
                setMistakes(response.data ?? []);
                setMeta(response.meta);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [projectId, page]);

    const summary = useMemo(() => {
        const totalOccurrences = mistakes.reduce((sum, m) => sum + (m.occurrence_count ?? 0), 0);
        const criticalCount = mistakes.filter((m) => m.severity === 'critical' || m.severity === 'high').length;

        return { totalOccurrences, criticalCount };
    }, [mistakes]);

    if (projectLoading || loading) return <LoadingState message="Loading mistakes…" />;
    if (projectError) return <ErrorAlert error={projectError} />;
    if (error) return <ErrorAlert error={error} />;

    return (
        <div>
            <PageHeader
                title="Mistakes"
                subtitle={`${project?.name ?? 'Your project'} — patterns to watch and improve`}
                actions={
                    <Link to="/practice" className="btn btn-primary">
                        Practice Weak Areas
                    </Link>
                }
            />

            {!mistakes.length ? (
                <EmptyState
                    title="No active mistakes"
                    description="Keep practicing to maintain your progress."
                    action={<Link to="/practice" className="btn btn-primary">Start Practice</Link>}
                />
            ) : (
                <>
                    <div className="row g-3 mb-4">
                        <div className="col-6 col-md-3">
                            <div className="wb-stat-card h-100">
                                <div className="wb-stat-label mb-2">Active Patterns</div>
                                <div className="wb-stat-value">{meta?.total ?? mistakes.length}</div>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="wb-stat-card h-100">
                                <div className="wb-stat-label mb-2">High Priority</div>
                                <div className="wb-stat-value">{summary.criticalCount}</div>
                            </div>
                        </div>
                        <div className="col-12 col-md-6">
                            <div className="wb-card p-3 h-100 d-flex align-items-center">
                                <p className="text-muted small mb-0">
                                    Focus on categories with the highest occurrence rate. Targeted practice
                                    helps the adaptive trainer prioritize these areas.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="row g-3 mb-4">
                        {mistakes.map((mistake, i) => (
                            <div key={`${mistake.category}-${i}`} className="col-12 col-lg-6">
                                <div className={`wb-mistake-card wb-card h-100 ${mistakeSeverityClass(mistake.severity)}`}>
                                    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                                        <span className="wb-mistake-category">
                                            {formatLabel(mistake.category)}
                                        </span>
                                        <span className={`badge ${mistake.severity === 'critical' || mistake.severity === 'high' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                            {formatLabel(mistake.severity)}
                                        </span>
                                    </div>

                                    <p className="wb-mistake-description mb-3">{mistake.description}</p>

                                    <div className="wb-mistake-metrics">
                                        <div className="wb-mistake-metric">
                                            <span className="wb-mistake-metric-value">{mistake.occurrence_count}</span>
                                            <span className="wb-mistake-metric-label">occurrences</span>
                                        </div>
                                        <div className="wb-mistake-metric">
                                            <span className="wb-mistake-metric-value">
                                                {Math.round(mistake.current_rate ?? 0)}%
                                            </span>
                                            <span className="wb-mistake-metric-label">current rate</span>
                                        </div>
                                    </div>

                                    <div className="wb-mistake-rate-bar mt-3">
                                        <div
                                            className="wb-mistake-rate-fill"
                                            style={{ width: `${Math.min(100, mistake.current_rate ?? 0)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

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
