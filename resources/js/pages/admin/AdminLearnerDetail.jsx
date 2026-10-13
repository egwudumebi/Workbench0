import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    enrolAdminLearner,
    fetchAdminLearner,
    fetchAdminTrainingPrograms,
    unenrolAdminLearner,
} from '../../api/admin';
import NavIcon from '../../components/ui/NavIcons';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { useAdminConfirm } from '../../hooks/useAdminConfirm';
import { learnerInitials } from '../../utils/learnerIdentity';
import { formatDate, formatLabel } from '../../utils/format';

function formatWhen(iso) {
    if (!iso) return '—';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 48) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 14) return `${diffDays}d ago`;
    return formatDate(iso);
}

function ResultBadge({ evaluation }) {
    if (!evaluation) {
        return <span className="wb-admin-dossier-muted">—</span>;
    }
    const passed = evaluation.passed;
    const score =
        evaluation.score != null
            ? Number(evaluation.score).toLocaleString(undefined, { maximumFractionDigits: 1 })
            : '—';
    return (
        <span className={`wb-admin-dossier-result ${passed ? 'is-pass' : 'is-fail'}`}>
            {score}
            <span aria-hidden>{passed ? ' ✓' : ' ✗'}</span>
        </span>
    );
}

function StatusPill({ status }) {
    const normalized = (status ?? '').toLowerCase();
    let tone = 'neutral';
    if (normalized === 'active' || normalized === 'completed' || normalized === 'published') {
        tone = 'good';
    } else if (normalized === 'in_progress' || normalized === 'draft') {
        tone = 'warn';
    }
    return <span className={`wb-admin-dossier-pill wb-admin-dossier-pill--${tone}`}>{formatLabel(status)}</span>;
}

function EmptyBlock({ icon, title, text }) {
    return (
        <div className="wb-admin-dossier-empty">
            {icon ? (
                <div className="wb-admin-dossier-empty-icon" aria-hidden>
                    {icon}
                </div>
            ) : null}
            <p className="wb-admin-dossier-empty-title">{title}</p>
            {text ? <p className="wb-admin-dossier-empty-text">{text}</p> : null}
        </div>
    );
}

function SectionPanel({ title, description, action, children }) {
    return (
        <section className="wb-admin-dossier-panel">
            <header className="wb-admin-dossier-panel-head">
                <div>
                    <h2 className="wb-admin-dossier-panel-title">{title}</h2>
                    {description ? <p className="wb-admin-dossier-panel-desc">{description}</p> : null}
                </div>
                {action ?? null}
            </header>
            {children}
        </section>
    );
}

export default function AdminLearnerDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [enrolProgramId, setEnrolProgramId] = useState('');
    const [enrolling, setEnrolling] = useState(false);
    const [unenrollingId, setUnenrollingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { confirm, dialog } = useAdminConfirm();

    const reload = useCallback(async () => {
        setData(await fetchAdminLearner(id));
    }, [id]);

    useEffect(() => {
        (async () => {
            try {
                await reload();
                setPrograms(await fetchAdminTrainingPrograms());
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [reload]);

    const handleUnenrol = async (enrolmentId, programName) => {
        const ok = await confirm({
            title: 'Remove enrolment?',
            message: `Remove enrolment in “${programName}”? The learner will lose programme progress tied to this enrolment.`,
            confirmLabel: 'Remove enrolment',
            variant: 'danger',
        });
        if (!ok) return;
        setUnenrollingId(enrolmentId);
        try {
            await unenrolAdminLearner(id, enrolmentId);
            await reload();
        } catch (err) {
            setError(err);
        } finally {
            setUnenrollingId(null);
        }
    };

    const handleEnrol = async (e) => {
        e.preventDefault();
        if (!enrolProgramId) return;
        setEnrolling(true);
        try {
            await enrolAdminLearner(id, Number(enrolProgramId));
            setEnrolProgramId('');
            await reload();
        } catch (err) {
            setError(err);
        } finally {
            setEnrolling(false);
        }
    };

    const xpProgress = useMemo(() => {
        if (!data?.academy_profile) return 0;
        const { xp, level_xp_floor, level_xp_ceiling } = data.academy_profile;
        const span = level_xp_ceiling - level_xp_floor;
        if (span <= 0) return 100;
        return Math.min(100, Math.max(0, ((xp - level_xp_floor) / span) * 100));
    }, [data]);

    if (loading) return <LoadingState message="Loading learner dossier…" />;
    if (error && !data) return <ErrorAlert error={error} />;
    if (!data) return null;

    const displayName = data.display_name?.trim() || data.user.name;
    const profile = data.academy_profile;
    const stats = data.stats;
    const initials = learnerInitials(displayName, data.user.email);
    const showLegalName = data.display_name?.trim() && data.display_name.trim() !== data.user.name;

    return (
        <div className="wb-admin-page wb-admin-page--dossier">
            <nav className="wb-admin-crumb mb-3" aria-label="Breadcrumb">
                <Link to="/admin/learners">Learners</Link>
                <span aria-hidden> / </span>
                <span className="text-body-secondary">{displayName}</span>
            </nav>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <header className="wb-admin-dossier-hero">
                <div className="wb-admin-dossier-identity">
                    <span className="wb-admin-dossier-avatar" aria-hidden>
                        {initials}
                    </span>
                    <div className="wb-admin-dossier-id-copy">
                        <p className="wb-admin-eyebrow mb-1">Learner dossier</p>
                        <h1 className="wb-admin-dossier-name">{displayName}</h1>
                        {showLegalName ? (
                            <p className="wb-admin-dossier-account-name">Account: {data.user.name}</p>
                        ) : null}
                        <a className="wb-admin-dossier-email" href={`mailto:${data.user.email}`}>
                            {data.user.email}
                        </a>
                        <p className="wb-admin-dossier-joined">
                            Joined {formatDate(data.user.created_at)}
                        </p>
                    </div>
                </div>

                <div className="wb-admin-dossier-xp">
                    <div className="wb-admin-dossier-xp-head">
                        <span className="wb-admin-dossier-xp-level">Level {profile.level}</span>
                        <span className="wb-admin-dossier-xp-count">
                            {profile.xp} XP
                            <span className="text-muted">
                                {' '}
                                / {profile.level_xp_ceiling} to next
                            </span>
                        </span>
                    </div>
                    <div
                        className="wb-admin-dossier-xp-bar"
                        role="progressbar"
                        aria-valuenow={Math.round(xpProgress)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Progress to next level"
                    >
                        <span className="wb-admin-dossier-xp-fill" style={{ width: `${xpProgress}%` }} />
                    </div>
                    <p className="wb-admin-dossier-streak">
                        {profile.streak_days} day streak
                    </p>
                </div>

                <ul className="wb-admin-dossier-kpis" aria-label="Activity summary">
                    <li>
                        <span className="wb-admin-dossier-kpi-value">{stats.submissions}</span>
                        <span className="wb-admin-dossier-kpi-label">Submissions</span>
                    </li>
                    <li>
                        <span className="wb-admin-dossier-kpi-value">{stats.assessments_completed}</span>
                        <span className="wb-admin-dossier-kpi-label">Assessments done</span>
                    </li>
                    <li>
                        <span className="wb-admin-dossier-kpi-value">{stats.practice_attempts}</span>
                        <span className="wb-admin-dossier-kpi-label">Arena attempts</span>
                    </li>
                    <li>
                        <span className="wb-admin-dossier-kpi-value">
                            {stats.lessons_completed}
                            {stats.lessons_in_progress > 0 ? (
                                <span className="wb-admin-dossier-kpi-sub"> +{stats.lessons_in_progress} in progress</span>
                            ) : null}
                        </span>
                        <span className="wb-admin-dossier-kpi-label">Lessons completed</span>
                    </li>
                </ul>
            </header>

            <SectionPanel
                title="Programme enrolments"
                description="Assign paths and track progress across academy programmes."
            >
                <form className="wb-admin-dossier-enrol-bar" onSubmit={handleEnrol}>
                    <select
                        className="form-select"
                        value={enrolProgramId}
                        onChange={(e) => setEnrolProgramId(e.target.value)}
                        aria-label="Programme to enrol"
                    >
                        <option value="">Enrol in programme…</option>
                        {programs.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({formatLabel(p.status)})
                            </option>
                        ))}
                    </select>
                    <button type="submit" className="btn btn-primary" disabled={!enrolProgramId || enrolling}>
                        {enrolling ? 'Enrolling…' : 'Enrol learner'}
                    </button>
                </form>

                {(data.enrolments ?? []).length > 0 ? (
                    <ul className="wb-admin-dossier-enrol-list">
                        {(data.enrolments ?? []).map((e) => {
                            const progress = Math.round(e.progress_percent ?? 0);
                            return (
                                <li key={e.id} className="wb-admin-dossier-enrol-card">
                                    <div className="wb-admin-dossier-enrol-main">
                                        {e.program?.id ? (
                                            <Link
                                                to={`/admin/training-programs/${e.program.id}`}
                                                className="wb-admin-dossier-enrol-title"
                                            >
                                                {e.program.name}
                                            </Link>
                                        ) : (
                                            <span className="wb-admin-dossier-enrol-title">—</span>
                                        )}
                                        <div className="wb-admin-dossier-enrol-meta">
                                            <StatusPill status={e.status} />
                                            <span className="text-muted">
                                                Last active {formatWhen(e.last_activity_at)}
                                            </span>
                                        </div>
                                        <div className="wb-admin-dossier-progress">
                                            <div className="wb-admin-dossier-progress-labels">
                                                <span>Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="wb-admin-dossier-progress-track">
                                                <span
                                                    className="wb-admin-dossier-progress-fill"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        disabled={unenrollingId === e.id}
                                        onClick={() => handleUnenrol(e.id, e.program?.name ?? 'programme')}
                                    >
                                        {unenrollingId === e.id ? 'Removing…' : 'Unenrol'}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <EmptyBlock
                        title="Not enrolled in any programme"
                        text="Choose a programme above to give this learner a learning path."
                    />
                )}
            </SectionPanel>

            <div className="wb-admin-dossier-split">
                <SectionPanel title="Recent practice" description="Latest task submissions across modes.">
                    {(data.recent_submissions ?? []).length > 0 ? (
                        <ul className="wb-admin-dossier-activity-list">
                            {(data.recent_submissions ?? []).map((s) => (
                                <li key={s.id}>
                                    <div className="wb-admin-dossier-activity-main">
                                        <span className="wb-admin-dossier-activity-title">
                                            {s.task_title ?? 'Untitled task'}
                                        </span>
                                        <span className="wb-admin-dossier-activity-sub">
                                            {formatLabel(s.mode)} ·{' '}
                                            <time dateTime={s.submitted_at} title={formatDate(s.submitted_at)}>
                                                {formatWhen(s.submitted_at)}
                                            </time>
                                        </span>
                                    </div>
                                    <ResultBadge evaluation={s.evaluation} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyBlock
                            icon={<NavIcon name="practice" />}
                            title="No submissions yet"
                            text="Practice and assessment attempts will appear here."
                        />
                    )}
                </SectionPanel>

                <SectionPanel title="Practice Arena" description="Challenge attempts and scores.">
                    {(data.recent_arena_attempts ?? []).length > 0 ? (
                        <ul className="wb-admin-dossier-activity-list">
                            {(data.recent_arena_attempts ?? []).map((a) => (
                                <li key={a.id}>
                                    <div className="wb-admin-dossier-activity-main">
                                        <span className="wb-admin-dossier-activity-title">
                                            {a.challenge?.title ?? 'Challenge'}
                                        </span>
                                        <span className="wb-admin-dossier-activity-sub">
                                            {a.challenge?.mode ? formatLabel(a.challenge.mode) : 'Arena'} ·{' '}
                                            <time dateTime={a.created_at} title={formatDate(a.created_at)}>
                                                {formatWhen(a.created_at)}
                                            </time>
                                        </span>
                                    </div>
                                    <span
                                        className={`wb-admin-dossier-result ${
                                            a.passed ? 'is-pass' : 'is-fail'
                                        }`}
                                    >
                                        {a.score_percent != null ? `${a.score_percent}%` : '—'}
                                        {a.passed ? ' ✓' : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyBlock
                            icon={<NavIcon name="mistakes" />}
                            title="No arena attempts yet"
                            text="Arena runs will show challenge title and score."
                        />
                    )}
                </SectionPanel>
            </div>

            <SectionPanel title="Assessments" description="Formal assessment sessions by training project.">
                {(data.recent_assessments ?? []).length > 0 ? (
                    <div className="wb-admin-table-wrap">
                        <table className="wb-admin-table wb-admin-table--compact">
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>Status</th>
                                    <th>Score</th>
                                    <th>Started</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.recent_assessments ?? []).map((a) => (
                                    <tr key={a.id}>
                                        <td className="fw-semibold">{a.project?.name ?? '—'}</td>
                                        <td>
                                            <StatusPill status={a.status} />
                                        </td>
                                        <td>
                                            {a.score != null ? (
                                                <span
                                                    className={`wb-admin-dossier-result ${
                                                        a.passed ? 'is-pass' : 'is-fail'
                                                    }`}
                                                >
                                                    {Number(a.score).toLocaleString(undefined, {
                                                        maximumFractionDigits: 1,
                                                    })}
                                                    {a.passed ? ' ✓' : ''}
                                                </span>
                                            ) : (
                                                <span className="wb-admin-dossier-muted">—</span>
                                            )}
                                        </td>
                                        <td className="text-muted text-nowrap">
                                            <time dateTime={a.started_at} title={formatDate(a.started_at)}>
                                                {formatWhen(a.started_at)}
                                            </time>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyBlock title="No assessments yet" />
                )}
            </SectionPanel>

            <SectionPanel title="Achievements" description="Recently earned badges and XP bonuses.">
                {(data.recent_achievements ?? []).length > 0 ? (
                    <ul className="wb-admin-dossier-achievement-list">
                        {data.recent_achievements.map((a) => (
                            <li key={`${a.slug}-${a.earned_at}`}>
                                <span className="wb-admin-dossier-achievement-name">{a.name}</span>
                                <span className="wb-admin-dossier-achievement-meta">
                                    +{a.xp_reward} XP · {formatWhen(a.earned_at)}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyBlock title="No achievements earned yet" />
                )}
            </SectionPanel>
            {dialog}
        </div>
    );
}
