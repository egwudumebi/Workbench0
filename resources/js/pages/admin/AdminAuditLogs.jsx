import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminAuditLogs } from '../../api/admin';
import NavIcon from '../../components/ui/NavIcons';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import {
    AUDIT_ACTION_FILTERS,
    auditActionTone,
    auditChangeSummary,
    auditEntityLabel,
    auditHasDetail,
    formatAuditWhen,
} from '../../utils/auditLogDisplay';
import { formatLabel } from '../../utils/format';

function adminInitials(name) {
    if (!name) return '?';
    return name
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function JsonBlock({ label, data }) {
    if (!data || Object.keys(data).length === 0) return null;
    return (
        <div className="wb-admin-audit-json-block">
            <p className="wb-admin-audit-json-label">{label}</p>
            <pre className="wb-admin-audit-json">{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}

function AuditLogRow({ log, expanded, onToggle }) {
    const when = formatAuditWhen(log.created_at);
    const tone = auditActionTone(log.action);
    const summary = auditChangeSummary(log);
    const hasDetail = auditHasDetail(log);
    const entity = auditEntityLabel(log.entity_type);
    const userName = log.user?.name ?? 'System';

    return (
        <article className={`wb-admin-audit-row ${expanded ? 'is-expanded' : ''}`}>
            <div className="wb-admin-audit-row-main">
                <div className="wb-admin-audit-when">
                    <time dateTime={log.created_at} title={when.full}>
                        {when.relative}
                    </time>
                    <span className="wb-admin-audit-when-full">{when.full}</span>
                </div>

                <div className="wb-admin-audit-actor">
                    <span className="wb-admin-audit-avatar" aria-hidden>
                        {adminInitials(userName)}
                    </span>
                    <div>
                        <span className="wb-admin-audit-actor-name">{userName}</span>
                        {log.user?.email ? (
                            <span className="wb-admin-audit-actor-email">{log.user.email}</span>
                        ) : null}
                    </div>
                </div>

                <div className="wb-admin-audit-action">
                    <span className={`wb-admin-audit-action-pill wb-admin-audit-action-pill--${tone}`}>
                        {formatLabel(log.action)}
                    </span>
                </div>

                <div className="wb-admin-audit-entity">
                    <span className="wb-admin-audit-entity-type">{entity}</span>
                    {log.entity_id != null ? (
                        <span className="wb-admin-audit-entity-id">#{log.entity_id}</span>
                    ) : null}
                </div>

                <div className="wb-admin-audit-summary">
                    {summary ? <p className="mb-0">{summary}</p> : <span className="text-muted">—</span>}
                </div>

                <div className="wb-admin-audit-row-actions">
                    {hasDetail ? (
                        <button
                            type="button"
                            className="btn btn-sm btn-link wb-admin-audit-toggle"
                            aria-expanded={expanded}
                            onClick={onToggle}
                        >
                            {expanded ? 'Hide detail' : 'View detail'}
                        </button>
                    ) : (
                        <span className="wb-admin-audit-no-detail text-muted">No payload</span>
                    )}
                </div>
            </div>

            {expanded && hasDetail ? (
                <div className="wb-admin-audit-detail">
                    <JsonBlock label="Before" data={log.before} />
                    <JsonBlock label="After" data={log.after} />
                </div>
            ) : null}
        </article>
    );
}

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const response = await fetchAdminAuditLogs({
                    page,
                    search,
                    actionFilter,
                });
                if (!cancelled) {
                    setLogs(response.data ?? []);
                    setMeta(response.meta);
                    setError(null);
                    setExpandedId(null);
                }
            } catch (err) {
                if (!cancelled) setError(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [page, search, actionFilter]);

    const summary = useMemo(() => {
        if (!meta) return null;
        return { total: meta.total, page: meta.current_page, pages: meta.last_page };
    }, [meta]);

    const clearFilters = () => {
        setPage(1);
        setSearch('');
        setActionFilter('');
    };

    const hasFilters = Boolean(search.trim() || actionFilter);

    return (
        <div className="wb-admin-page wb-admin-page--audit">
            <header className="wb-admin-list-hero wb-admin-list-hero--compliance">
                <div className="wb-admin-list-hero-main">
                    <p className="wb-admin-eyebrow">Compliance</p>
                    <h1 className="wb-admin-dash-title">
                        <span className="wb-admin-dash-title-brand">Workbench</span>
                        <span className="wb-admin-dash-title-dot" aria-hidden>
                            ·
                        </span>
                        <span className="wb-admin-dash-title-role">Audit logs</span>
                    </h1>
                    <p className="wb-admin-dash-lead">
                        Immutable trail of admin changes to programmes, tasks, arena quests, and learner enrolments.
                        Expand an entry to inspect stored before/after payloads.
                    </p>
                </div>
                {summary && !loading ? (
                    <ul className="wb-admin-dash-hero-kpis" aria-label="Audit log counts">
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">{summary.total}</span>
                            <span className="wb-admin-dash-hero-kpi-label">Total events</span>
                        </li>
                        <li>
                            <span className="wb-admin-dash-hero-kpi-value">
                                {summary.pages > 1 ? `${summary.page}/${summary.pages}` : '1'}
                            </span>
                            <span className="wb-admin-dash-hero-kpi-label">Page</span>
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
                        placeholder="Search action, entity, or admin…"
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                        }}
                        aria-label="Search audit logs"
                    />
                    {search ? (
                        <button
                            type="button"
                            className="wb-admin-list-search-clear"
                            onClick={() => {
                                setPage(1);
                                setSearch('');
                            }}
                        >
                            Clear
                        </button>
                    ) : null}
                </label>

                <div className="wb-admin-audit-filters" role="group" aria-label="Filter by action type">
                    {AUDIT_ACTION_FILTERS.map((filter) => (
                        <button
                            key={filter.id || 'all'}
                            type="button"
                            className={`wb-admin-audit-filter-pill ${actionFilter === filter.id ? 'is-active' : ''}`}
                            onClick={() => {
                                setPage(1);
                                setActionFilter(filter.id);
                            }}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {meta && !loading ? (
                <p className="wb-admin-list-result-count">
                    {meta.total === 0
                        ? 'No audit events'
                        : meta.total === 1
                          ? '1 event'
                          : `${meta.total} events`}
                    {hasFilters ? ' matching filters' : ''}
                </p>
            ) : null}

            {loading ? (
                <LoadingState message="Loading audit logs…" />
            ) : logs.length > 0 ? (
                <>
                    <div className="wb-admin-audit-list-head" aria-hidden>
                        <span>When</span>
                        <span>Admin</span>
                        <span>Action</span>
                        <span>Entity</span>
                        <span>Summary</span>
                        <span />
                    </div>
                    <div className="wb-admin-audit-list" role="list">
                        {logs.map((log) => (
                            <div key={log.id} role="listitem">
                                <AuditLogRow
                                    log={log}
                                    expanded={expandedId === log.id}
                                    onToggle={() =>
                                        setExpandedId((current) => (current === log.id ? null : log.id))
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    {meta && meta.last_page > 1 ? (
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
                    ) : null}
                </>
            ) : (
                <div className="wb-admin-dash-empty">
                    <div className="wb-admin-dash-empty-icon" aria-hidden>
                        <NavIcon name="history" />
                    </div>
                    <h2 className="wb-admin-dash-empty-title">
                        {hasFilters ? 'No events match your filters' : 'No audit entries yet'}
                    </h2>
                    <p className="wb-admin-dash-empty-text">
                        {hasFilters
                            ? 'Try a different search or action filter, or clear filters to see the full trail.'
                            : 'When you edit programmes, tasks, or arena content, those actions are recorded here automatically.'}
                    </p>
                    {hasFilters ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={clearFilters}>
                            Clear filters
                        </button>
                    ) : (
                        <Link to="/admin" className="btn btn-primary btn-sm">
                            Back to overview
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
