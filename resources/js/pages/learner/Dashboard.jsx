import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { fetchDashboard } from '../../api/progress';
import { useAcademyStats } from '../../context/AcademyStatsContext';
import { useLearnerIdentity } from '../../hooks/useLearnerIdentity';
import { useDefaultProject } from '../../hooks/useDefaultProject';
import { getStoredProjectId } from '../../utils/projectSelection';
import { formatDate, formatLabel } from '../../utils/format';
import { levelTitle } from '../../utils/levelTitles';
import LearningInsightCalendar from '../../components/academy/LearningInsightCalendar';

const SKILL_COLORS = [
    { min: 75, class: 'high' },
    { min: 50, class: 'mid' },
    { min: 0, class: 'low' },
];

function skillBarClass(score) {
    const tier = SKILL_COLORS.find((t) => score >= t.min) ?? SKILL_COLORS[2];
    return tier.class;
}

function pluralUnit(count, singular, plural = `${singular}s`) {
    return `${count} ${count === 1 ? singular : plural}`;
}

function formatEstimatedTime(hours) {
    if (!hours || hours < 1) return '<1 hour';
    if (hours === 1) return '~1 hour';
    return `~${hours} hours`;
}

export default function Dashboard() {
    const { firstName } = useLearnerIdentity();
    const { stats: academy, loading: academyLoading, refresh } = useAcademyStats();
    const { project, projectId, loading: projectLoading, error: projectError } = useDefaultProject();
    const [projectDash, setProjectDash] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!projectId) return;
        fetchDashboard(projectId).then(setProjectDash).catch(setError);
    }, [projectId]);

    useEffect(() => {
        refresh();
    }, [projectId, refresh]);

    if (academyLoading || projectLoading) return <DashboardSkeleton />;
    if (projectError) return <ErrorAlert error={projectError} />;
    if (error) return <ErrorAlert error={error} />;

    const skills = projectDash?.skills ?? [];
    const mastered = skills.filter((s) => s.mastery_score >= 80).length;
    const profile = academy?.profile;
    const xpFloor = profile?.level_xp_floor ?? 0;
    const xpCeiling = profile?.level_xp_ceiling ?? xpFloor + 200;
    const xpSpan = Math.max(1, xpCeiling - xpFloor);
    const xpPct = profile ? Math.min(100, ((profile.xp - xpFloor) / xpSpan) * 100) : 0;

    const storedProjectId = getStoredProjectId();
    const activeProjectLink = storedProjectId ? `/projects/${storedProjectId}` : '/projects';

    const continueProgram = academy?.continue_program;
    const continueLesson = academy?.continue_lesson?.lesson;
    const recommended = academy?.recommended_lesson;
    const nextLesson = continueLesson ?? recommended;
    const continueHref = nextLesson
        ? `/academy-lessons/${nextLesson.id}`
        : continueProgram
            ? `/explore/${continueProgram.id}`
            : '/explore';
    const progressPct = continueProgram ? Math.round(continueProgram.progress_percent) : 0;
    const daily = academy?.daily_challenge;

    return (
        <div className="wb-hub-dashboard">
            <section className="wb-hub-welcome">
                <div className="wb-hub-welcome-inner">
                    <div className="wb-hub-welcome-text">
                        <h1 className="wb-hub-welcome-title">
                            Welcome back, {firstName} 👋
                        </h1>
                        <p className="wb-hub-welcome-sub">
                            You&apos;re making great progress. Keep building your evaluation skills.
                        </p>
                        {profile && (
                            <div className="wb-hub-level-block">
                                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                    <span className="wb-hub-level-badge">Level {profile.level}</span>
                                    <span className="wb-hub-level-name">{levelTitle(profile.level)}</span>
                                </div>
                                <div className="wb-hub-xp-bar">
                                    <div className="wb-hub-xp-bar-fill" style={{ width: `${xpPct}%` }} />
                                </div>
                                <div className="wb-hub-xp-labels">
                                    <span>{profile.xp.toLocaleString()} XP</span>
                                    <span>{xpCeiling.toLocaleString()} XP to Level {profile.level + 1}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="wb-hub-welcome-art" aria-hidden />
                </div>
            </section>

            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                    <div className="wb-hub-mini-stat">
                        <div className="wb-hub-mini-icon ring">◔</div>
                        <div>
                            <div className="wb-hub-mini-label">Overall Progress</div>
                            <div className="wb-hub-mini-value">{Math.round(academy?.overall_progress_percent ?? 0)}%</div>
                            <div className="wb-hub-mini-bar"><span style={{ width: `${academy?.overall_progress_percent ?? 0}%` }} /></div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="wb-hub-mini-stat">
                        <div className="wb-hub-mini-icon flame">🔥</div>
                        <div>
                            <div className="wb-hub-mini-label">Learning Streak</div>
                            <div className="wb-hub-mini-value">{profile?.streak_days ?? 0} days</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="wb-hub-mini-stat">
                        <div className="wb-hub-mini-icon trophy">🏆</div>
                        <div>
                            <div className="wb-hub-mini-label">Achievements</div>
                            <div className="wb-hub-mini-value">
                                {academy?.achievements_summary?.earned ?? 0} / {academy?.achievements_summary?.total ?? 0}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="wb-hub-mini-stat">
                        <div className="wb-hub-mini-icon grad">🎓</div>
                        <div>
                            <div className="wb-hub-mini-label">Skills Mastered</div>
                            <div className="wb-hub-mini-value">{mastered} / {skills.length || '—'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-xl-8">
                    <div className="wb-hub-continue-head">
                        <h2 className="wb-hub-section-title mb-0">Continue Learning</h2>
                        {continueProgram && (
                            <Link to={`/explore/${continueProgram.id}`} className="wb-hub-continue-head-link">
                                Campaign map →
                            </Link>
                        )}
                    </div>
                    {continueProgram ? (
                        <article className="wb-hub-continue-card">
                            <Link
                                to={`/explore/${continueProgram.id}`}
                                className="wb-hub-continue-media"
                                aria-label={`View ${continueProgram.name} campaign`}
                            >
                                <span
                                    className="wb-hub-continue-media-bg"
                                    style={{ backgroundImage: 'url(/brand/hero-algorithm.webp)' }}
                                />
                                <span className="wb-hub-continue-media-shade" aria-hidden />
                                <span className="wb-hub-continue-media-tag">Academy campaign</span>
                            </Link>
                            <div className="wb-hub-continue-content">
                                <div className="wb-hub-continue-top">
                                    <span className="wb-hub-status-badge progress">In progress</span>
                                    <span className="wb-hub-continue-pct">{progressPct}%</span>
                                </div>
                                <h3 className="wb-hub-continue-title">{continueProgram.name}</h3>
                                <p className="wb-hub-continue-desc">{continueProgram.description}</p>
                                {nextLesson?.title && (
                                    <p className="wb-hub-continue-next">
                                        <span className="wb-hub-continue-next-label">Up next</span>
                                        {nextLesson.title}
                                    </p>
                                )}
                                <div className="wb-hub-continue-progress">
                                    <div
                                        className="wb-hub-continue-progress-bar"
                                        role="progressbar"
                                        aria-valuenow={progressPct}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label="Campaign progress"
                                    >
                                        <span style={{ width: `${progressPct}%` }} />
                                    </div>
                                    <span className="wb-hub-continue-progress-label">{progressPct}% complete</span>
                                </div>
                                <div className="wb-hub-continue-foot">
                                    <div className="wb-hub-continue-meta">
                                        <span>{pluralUnit(continueProgram.modules_count, 'module')}</span>
                                        <span>{pluralUnit(continueProgram.lessons_count, 'lesson')}</span>
                                        <span>{formatEstimatedTime(continueProgram.estimated_hours)}</span>
                                    </div>
                                    <div className="wb-hub-continue-actions">
                                        <Link to={continueHref} className="btn wb-hub-continue-btn-primary">
                                            {nextLesson ? 'Resume lesson →' : 'Start campaign →'}
                                        </Link>
                                        <Link to={`/explore/${continueProgram.id}`} className="btn wb-hub-continue-btn-ghost">
                                            View map
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ) : (
                        <div className="wb-hub-continue-empty">
                            <p className="mb-3 text-muted">
                                Enrol in a campaign from Explore Academy or choose a training project to begin.
                            </p>
                            <div className="d-flex flex-wrap gap-2">
                                <Link to="/explore" className="btn btn-primary">
                                    Browse campaigns
                                </Link>
                                <Link to="/projects" className="btn btn-outline-secondary">
                                    Training projects
                                </Link>
                            </div>
                        </div>
                    )}

                    <h2 className="wb-hub-section-title mt-4">My Learning Paths</h2>
                    <div className="d-flex flex-column gap-3">
                        {(academy?.enrolments ?? []).map((e) => (
                            <Link
                                key={e.id}
                                to={`/explore/${e.training_program_id}`}
                                className="wb-hub-path-row text-decoration-none"
                            >
                                <div className="wb-hub-path-icon">📘</div>
                                <div className="flex-grow-1">
                                    <div className="fw-semibold text-dark">{e.program?.name}</div>
                                    <div className="small text-muted">{e.program?.description?.slice(0, 90)}…</div>
                                    <div className="wb-hub-xp-bar mt-2" style={{ maxWidth: 280 }}>
                                        <div className="wb-hub-xp-bar-fill" style={{ width: `${e.progress_percent}%` }} />
                                    </div>
                                </div>
                                <span className={`wb-hub-status-badge ${e.progress_percent > 0 ? 'progress' : 'idle'}`}>
                                    {e.progress_percent > 0 ? 'In Progress' : 'Not Started'}
                                </span>
                            </Link>
                        ))}
                        {!academy?.enrolments?.length && (
                            <p className="text-muted">No paths yet. <Link to="/explore">Browse programmes</Link>.</p>
                        )}
                    </div>

                    {academy?.learning_calendar && (
                        <div className="mt-4">
                            <LearningInsightCalendar
                                calendar={academy.learning_calendar}
                                exploreLink={
                                    academy.learning_calendar.program_id
                                        ? `/explore/${academy.learning_calendar.program_id}`
                                        : null
                                }
                            />
                        </div>
                    )}
                </div>

                <div className="col-xl-4">
                    <div className="wb-hub-widget wb-hub-widget-project mb-3">
                        <h3 className="wb-hub-widget-title">Training project</h3>
                        <p className="small text-muted mb-3">
                            {project?.name ?? 'Choose a focus to unlock your full path—videos, lessons, practice, and games.'}
                        </p>
                        <Link to={activeProjectLink} className="btn btn-outline-primary w-100 mb-2">
                            {storedProjectId ? 'Open learning path →' : 'Choose training project →'}
                        </Link>
                        {storedProjectId && (
                            <Link to={`/practice?project=${storedProjectId}`} className="btn btn-primary w-100">
                                Evaluation practice
                            </Link>
                        )}
                    </div>

                    <div className="wb-hub-widget mb-3">
                        <h3 className="wb-hub-widget-title">Recommended Next</h3>
                        {recommended ? (
                            <>
                                <p className="mb-2 fw-medium">{recommended.title}</p>
                                <p className="small text-muted mb-3">{recommended.summary ?? 'Continue your learning path.'}</p>
                                <Link to={`/academy-lessons/${recommended.id}`} className="btn btn-primary w-100">
                                    Start Lesson
                                </Link>
                            </>
                        ) : (
                            <Link to="/explore" className="btn btn-outline-primary w-100">Browse lessons</Link>
                        )}
                    </div>

                    <div className="wb-hub-widget wb-hub-widget-challenge mb-3">
                        <h3 className="wb-hub-widget-title">Today&apos;s Challenge</h3>
                        <div className="d-flex align-items-start gap-2 mb-2">
                            <span className="wb-hub-challenge-icon">🎯</span>
                            <div>
                                <div className="fw-semibold">{daily?.title ?? 'Practice Arena'}</div>
                                <div className="small text-muted">{daily?.mode === 'spot_the_error' ? 'Spot the Error' : 'Response Duel'}</div>
                            </div>
                        </div>
                        <span className="wb-hub-xp-reward">+ 50 XP</span>
                        <Link to="/practice-arena" className="btn btn-primary w-100 mt-3">Play Now</Link>
                    </div>

                    <div className="wb-hub-widget mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3 className="wb-hub-widget-title mb-0">Recent Achievements</h3>
                            <Link to="/achievements" className="small">View All</Link>
                        </div>
                        <div className="wb-hub-achievement-grid">
                            {(academy?.recent_achievements ?? []).slice(0, 3).map((a) => (
                                <div key={a.slug} className="wb-hub-achievement-item">
                                    <div className="wb-hub-achievement-medal">★</div>
                                    <div className="small fw-semibold">{a.name}</div>
                                    <div className="small text-muted">{a.earned_at ? formatDate(a.earned_at) : ''}</div>
                                </div>
                            ))}
                            {!academy?.recent_achievements?.length && (
                                <p className="small text-muted mb-0">Complete lessons to earn badges.</p>
                            )}
                        </div>
                    </div>

                    <div className="wb-hub-widget mb-3">
                        <h3 className="wb-hub-widget-title">Your Skills</h3>
                        {skills.length ? (
                            skills.slice(0, 4).map((skill) => (
                                <div key={skill.slug} className="wb-hub-skill-row">
                                    <div className="d-flex justify-content-between small mb-1">
                                        <span>{skill.name}</span>
                                        <span>{Math.round(skill.mastery_score)}%</span>
                                    </div>
                                    <div className="wb-hub-skill-track">
                                        <div
                                            className={`wb-hub-skill-fill ${skillBarClass(skill.mastery_score)}`}
                                            style={{ width: `${skill.mastery_score}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="small text-muted mb-0">Practice tasks to reveal skill bars.</p>
                        )}
                        <Link to="/skills" className="btn btn-sm btn-link mt-2 px-0">Full skill report →</Link>
                    </div>

                    <div className="wb-hub-tip">
                        <div className="wb-hub-tip-art" aria-hidden />
                        <p className="mb-0 small">Small steps build great evaluators. Keep learning, keep growing!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
