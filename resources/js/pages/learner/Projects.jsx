import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPrograms } from '../../api/academy';
import { fetchProjects } from '../../api/projects';
import GamePageHero from '../../components/academy/GamePageHero';
import EmptyState from '../../components/ui/EmptyState';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { useAcademyStats } from '../../context/AcademyStatsContext';
import { getStoredProjectId } from '../../utils/projectSelection';

const PROJECT_ICONS = ['🤖', '⚖️', '🧠', '🛡️', '📋'];

const TRAINING_LOOP = [
    { icon: '🎬', label: 'Campaigns', hint: 'Video & quizzes' },
    { icon: '📖', label: 'Lessons', hint: 'Rubrics & examples' },
    { icon: '⚔️', label: 'Practice', hint: 'Evaluation studio' },
    { icon: '🎮', label: 'Arena', hint: 'Mini-games' },
    { icon: '🏁', label: 'Assessment', hint: 'Readiness check' },
];

function programsForProject(programs, projectId) {
    return programs.filter((p) => String(p.project_id) === String(projectId));
}

function ProjectSpotlight({ project, index, isActive, campaignCount }) {
    const icon = PROJECT_ICONS[index % PROJECT_ICONS.length];

    return (
        <article className={`wb-project-spotlight ${isActive ? 'is-active' : ''}`}>
            <div className="wb-project-spotlight-art" aria-hidden>
                <span className="wb-project-spotlight-glow" />
                <span className="wb-project-spotlight-icon">{icon}</span>
            </div>
            <div className="wb-project-spotlight-body">
                <div className="wb-project-spotlight-badges">
                    {isActive && <span className="wb-project-spotlight-badge active">Active focus</span>}
                    <span className="wb-project-spotlight-badge rank">Training domain</span>
                    {campaignCount > 0 && (
                        <span className="wb-project-spotlight-badge meta">{campaignCount} campaigns</span>
                    )}
                </div>
                <h2 className="wb-project-spotlight-title">{project.name}</h2>
                <p className="wb-project-spotlight-desc">{project.description}</p>
                <div className="wb-project-spotlight-features">
                    {TRAINING_LOOP.map((step) => (
                        <span key={step.label} className="wb-project-spotlight-feature" title={step.hint}>
                            <span aria-hidden>{step.icon}</span>
                            {step.label}
                        </span>
                    ))}
                </div>
                <div className="wb-project-spotlight-actions">
                    <Link to={`/projects/${project.id}`} className="btn wb-project-spotlight-cta">
                        {isActive ? 'Open learning path →' : 'Choose & build path →'}
                    </Link>
                    {isActive && (
                        <>
                            <Link to={`/practice?project=${project.id}`} className="btn wb-project-spotlight-cta-secondary">
                                Evaluation practice
                            </Link>
                            <Link to="/practice-arena" className="btn wb-project-spotlight-cta-ghost">
                                Arena
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}

function ProjectCompactCard({ project, index, isActive, campaignCount }) {
    const icon = PROJECT_ICONS[index % PROJECT_ICONS.length];

    return (
        <Link
            to={`/projects/${project.id}`}
            className={`wb-project-compact-card ${isActive ? 'is-active' : ''}`}
        >
            <span className="wb-project-compact-icon" aria-hidden>
                {icon}
            </span>
            <div className="wb-project-compact-body">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h3 className="wb-project-compact-title">{project.name}</h3>
                    {isActive && <span className="wb-project-compact-pill">Active</span>}
                </div>
                <p className="wb-project-compact-desc">{project.description}</p>
                {campaignCount > 0 && (
                    <span className="wb-project-compact-meta">{campaignCount} academy campaigns</span>
                )}
            </div>
            <span className="wb-project-compact-arrow" aria-hidden>
                →
            </span>
        </Link>
    );
}

export default function Projects() {
    const { stats: academy } = useAcademyStats();
    const [projects, setProjects] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const activeId = getStoredProjectId();
    const profile = academy?.profile;

    useEffect(() => {
        (async () => {
            try {
                const [projectRes, programList] = await Promise.all([fetchProjects(), fetchPrograms()]);
                setProjects(projectRes.data ?? []);
                setPrograms(programList ?? []);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const ordered = useMemo(() => {
        if (!projects.length) return [];
        const copy = [...projects];
        copy.sort((a, b) => {
            const aActive = activeId && String(a.id) === String(activeId) ? 1 : 0;
            const bActive = activeId && String(b.id) === String(activeId) ? 1 : 0;
            return bActive - aActive;
        });
        return copy;
    }, [projects, activeId]);

    const spotlight = ordered[0] ?? null;
    const others = ordered.slice(1);

    if (loading) return <LoadingState message="Loading training projects…" />;
    if (error) return <ErrorAlert error={error} />;

    return (
        <div className="wb-gamehub-page wb-project-pick-page">
            <GamePageHero
                eyebrow="Step 1 · Choose your focus"
                title="Training projects"
                subtitle="Each domain bundles videos, lessons, evaluation practice, arena games, and assessments into one path."
                stats={[
                    { value: projects.length, label: 'Available' },
                    {
                        value: activeId ? '1' : '0',
                        label: 'Active focus',
                        variant: activeId ? 'gold' : undefined,
                    },
                    profile
                        ? { value: `Lv ${profile.level}`, label: `${profile.xp} XP`, variant: 'fire' }
                        : null,
                ].filter(Boolean)}
            />

            {!projects.length ? (
                <EmptyState
                    title="No projects available"
                    description="An admin needs to publish training projects before you can build a path."
                />
            ) : (
                <div className="wb-project-pick-shell">
                    <div className="wb-project-pick-main">
                        <header className="wb-project-pick-header">
                            <div>
                                <h2 className="wb-project-pick-heading">Your evaluation focus</h2>
                                <p className="wb-project-pick-lede">
                                    {spotlight && activeId && String(spotlight.id) === String(activeId)
                                        ? 'You are training on this project. Continue your loop or switch focus below.'
                                        : 'Select a project to unlock a guided path tailored to that rubric.'}
                                </p>
                            </div>
                        </header>

                        {spotlight && (
                            <ProjectSpotlight
                                project={spotlight}
                                index={projects.findIndex((p) => p.id === spotlight.id)}
                                isActive={activeId && String(spotlight.id) === String(activeId)}
                                campaignCount={programsForProject(programs, spotlight.id).length}
                            />
                        )}

                        {others.length > 0 && (
                            <section className="wb-project-pick-more">
                                <h3 className="wb-project-pick-more-title">
                                    Other training domains
                                    <span className="wb-project-pick-more-count">{others.length}</span>
                                </h3>
                                <div className="wb-project-pick-more-list">
                                    {others.map((project) => (
                                        <ProjectCompactCard
                                            key={project.id}
                                            project={project}
                                            index={projects.findIndex((p) => p.id === project.id)}
                                            isActive={activeId && String(project.id) === String(activeId)}
                                            campaignCount={programsForProject(programs, project.id).length}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <aside className="wb-project-pick-aside" aria-labelledby="wb-project-loop-title">
                        <h2 id="wb-project-loop-title" className="wb-project-aside-title">
                            How your path works
                        </h2>
                        <p className="wb-project-aside-lede">
                            One project, five beats—repeat until you are assessment-ready.
                        </p>
                        <ol className="wb-project-aside-loop">
                            {TRAINING_LOOP.map((step, i) => (
                                <li key={step.label}>
                                    <span className="wb-project-aside-step">{i + 1}</span>
                                    <span className="wb-project-aside-step-icon" aria-hidden>
                                        {step.icon}
                                    </span>
                                    <div>
                                        <strong>{step.label}</strong>
                                        <span>{step.hint}</span>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <div className="wb-project-aside-tip">
                            <span className="wb-project-aside-tip-icon" aria-hidden>
                                💡
                            </span>
                            <p>
                                Enrol in an academy campaign for the same project to sync video progress with practice
                                tasks.
                            </p>
                        </div>
                        <Link to="/explore" className="btn wb-project-aside-link w-100">
                            Browse academy campaigns
                        </Link>
                    </aside>
                </div>
            )}
        </div>
    );
}
