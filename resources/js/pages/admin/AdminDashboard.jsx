import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminDashboard } from '../../api/admin';
import NavIcon from '../../components/ui/NavIcons';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { formatDate, formatLabel } from '../../utils/format';

const QUICK_ACTIONS = [
    {
        to: '/admin/projects',
        label: 'Training projects',
        icon: 'projects',
        tone: 'sky',
        blurb: 'Rubrics, versions, task types',
    },
    {
        to: '/admin/training-programs',
        label: 'Programmes',
        icon: 'lessons',
        tone: 'violet',
        blurb: 'Modules, lessons, publish state',
    },
    {
        to: '/admin/tasks',
        label: 'Task bank',
        icon: 'practice',
        tone: 'amber',
        blurb: 'Practice and assessment items',
    },
    {
        to: '/admin/practice-arena',
        label: 'Practice Arena',
        icon: 'mistakes',
        tone: 'rose',
        blurb: 'Duels, dailies, boss quests',
    },
    {
        to: '/admin/learners',
        label: 'Learners',
        icon: 'skills',
        tone: 'teal',
        blurb: 'Dossiers, enrolments, progress',
    },
    {
        to: '/admin/achievements',
        label: 'Achievements',
        icon: 'skills',
        tone: 'gold',
        blurb: 'XP rewards and earn rules',
    },
    {
        to: '/admin/audit-logs',
        label: 'Audit logs',
        icon: 'history',
        tone: 'slate',
        blurb: 'Who changed what, and when',
    },
];

function formatWhen(iso) {
    if (!iso) return '—';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 48) return `${diffHours}h ago`;
    return formatDate(iso);
}

function StatTile({ value, label, hint }) {
    return (
        <div className="wb-admin-dash-stat">
            <div className="wb-admin-dash-stat-value">{value}</div>
            <div className="wb-admin-dash-stat-label">{label}</div>
            {hint ? <div className="wb-admin-dash-stat-hint">{hint}</div> : null}
        </div>
    );
}

function MetricGroup({ title, description, children }) {
    return (
        <article className="wb-admin-dash-metric-group">
            <header className="wb-admin-dash-metric-head">
                <h3 className="wb-admin-dash-metric-title">{title}</h3>
                {description ? <p className="wb-admin-dash-metric-desc">{description}</p> : null}
            </header>
            <div className="wb-admin-dash-metric-body">{children}</div>
        </article>
    );
}

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                setData(await fetchAdminDashboard());
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const headlineStats = useMemo(() => {
        if (!data) return [];
        const c = data.counts;
        return [
            { label: 'Active learners', value: c.learners },
            { label: 'Published programmes', value: c.training_programs_published },
            { label: 'Practice submissions', value: c.submissions },
        ];
    }, [data]);

    if (loading) return <LoadingState message="Loading operations overview…" />;
    if (error) return <ErrorAlert error={error} />;

    const c = data.counts;
    const auditRows = data.recent_audit ?? [];

    return (
        <div className="wb-admin-page wb-admin-page--dashboard">
            <section className="wb-admin-dash-hero" aria-labelledby="admin-overview-title">
                <div className="wb-admin-dash-hero-main">
                    <p className="wb-admin-eyebrow">Operations console</p>
                    <h1 id="admin-overview-title" className="wb-admin-dash-title">
                        <span className="wb-admin-dash-title-brand">Workbench</span>
                        <span className="wb-admin-dash-title-dot" aria-hidden>
                            ·
                        </span>
                        <span className="wb-admin-dash-title-role">Admin overview</span>
                    </h1>
                    <p className="wb-admin-dash-lead">
                        Manage training domains, academy content, learners, and compliance—separate from the
                        learner hub experience.
                    </p>
                </div>
                <ul className="wb-admin-dash-hero-kpis" aria-label="Key metrics">
                    {headlineStats.map((item) => (
                        <li key={item.label}>
                            <span className="wb-admin-dash-hero-kpi-value">{item.value}</span>
                            <span className="wb-admin-dash-hero-kpi-label">{item.label}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="wb-admin-section" aria-labelledby="platform-snapshot">
                <h2 id="platform-snapshot" className="wb-admin-section-title">
                    Platform snapshot
                </h2>
                <div className="wb-admin-dash-metric-grid">
                    <MetricGroup title="People & access" description="Accounts and programme enrolments">
                        <StatTile label="Learners" value={c.learners} hint={`${c.admins} admin`} />
                        <StatTile label="Enrolments" value={c.enrolments} />
                    </MetricGroup>
                    <MetricGroup title="Content library" description="Domains, paths, and practice assets">
                        <StatTile
                            label="Active projects"
                            value={c.projects_active}
                            hint={`${c.projects_total} total`}
                        />
                        <StatTile
                            label="Programmes live"
                            value={c.training_programs_published}
                            hint={`${c.training_programs} total`}
                        />
                        <StatTile label="Tasks" value={c.tasks} />
                        <StatTile label="Arena challenges" value={c.practice_challenges} />
                    </MetricGroup>
                    <MetricGroup title="Learner activity" description="Signals from practice and assessment">
                        <StatTile label="Submissions" value={c.submissions} />
                        <StatTile label="Assessments done" value={c.assessments_completed} />
                    </MetricGroup>
                </div>
            </section>

            <div className="wb-admin-dash-split">
                <section className="wb-admin-section wb-admin-dash-split-main" aria-labelledby="quick-actions">
                    <h2 id="quick-actions" className="wb-admin-section-title">
                        Quick actions
                    </h2>
                    <div className="wb-admin-dash-action-grid">
                        {QUICK_ACTIONS.map((action) => (
                            <Link
                                key={action.to}
                                to={action.to}
                                className="wb-admin-dash-action-card"
                            >
                                <span
                                    className={`wb-admin-dash-action-icon wb-admin-dash-action-icon--${action.tone}`}
                                    aria-hidden
                                >
                                    <NavIcon name={action.icon} />
                                </span>
                                <div className="wb-admin-dash-action-copy">
                                    <div className="wb-admin-dash-action-label">{action.label}</div>
                                    <div className="wb-admin-dash-action-blurb">{action.blurb}</div>
                                </div>
                                <span className="wb-admin-dash-action-chevron" aria-hidden>
                                    →
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <aside className="wb-admin-dash-aside" aria-labelledby="ops-shortcuts">
                    <h2 id="ops-shortcuts" className="wb-admin-dash-aside-title">
                        Operator shortcuts
                    </h2>
                    <ul className="wb-admin-dash-shortcut-list">
                        <li>
                            <Link to="/admin/learners">Enrol or review a learner</Link>
                        </li>
                        <li>
                            <Link to="/admin/training-programs">Edit programme structure</Link>
                        </li>
                        <li>
                            <Link to="/admin/practice-arena">Publish arena challenge</Link>
                        </li>
                        <li>
                            <Link to="/admin/audit-logs">Review compliance trail</Link>
                        </li>
                    </ul>
                    <p className="wb-admin-dash-aside-note">
                        Preview the learner UI with <code>learner@workbench0.local</code>—admins are routed here
                        after sign-in.
                    </p>
                </aside>
            </div>

            <section className="wb-admin-section" aria-labelledby="recent-activity">
                <div className="wb-admin-dash-activity-head">
                    <div>
                        <h2 id="recent-activity" className="wb-admin-section-title mb-1">
                            Recent admin activity
                        </h2>
                        <p className="wb-admin-dash-activity-sub">
                            Latest changes across content, learners, and configuration.
                        </p>
                    </div>
                    <Link to="/admin/audit-logs" className="btn btn-sm btn-outline-secondary">
                        Full audit log
                    </Link>
                </div>

                {auditRows.length > 0 ? (
                    <div className="wb-admin-table-wrap">
                        <table className="wb-admin-table">
                            <thead>
                                <tr>
                                    <th>When</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Entity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditRows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="text-muted text-nowrap" title={formatDate(row.created_at)}>
                                            {formatWhen(row.created_at)}
                                        </td>
                                        <td>{row.user?.name ?? '—'}</td>
                                        <td>
                                            <span className="wb-admin-dash-action-pill">
                                                {formatLabel(row.action)}
                                            </span>
                                        </td>
                                        <td className="text-muted">
                                            {formatLabel(row.entity_type?.split('\\').pop() ?? row.entity_type)}
                                            {row.entity_id != null ? ` #${row.entity_id}` : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="wb-admin-dash-empty">
                        <div className="wb-admin-dash-empty-icon" aria-hidden>
                            <NavIcon name="history" />
                        </div>
                        <h3 className="wb-admin-dash-empty-title">No audit entries yet</h3>
                        <p className="wb-admin-dash-empty-text">
                            When you create programmes, enrol learners, or edit arena content, those events will
                            show up here for a quick compliance check.
                        </p>
                        <Link to="/admin/training-programs" className="btn btn-primary btn-sm">
                            Start with programmes
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}
