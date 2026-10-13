import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPrograms } from '../../api/academy';
import { fetchProject, fetchProjectLessons } from '../../api/projects';
import GamePageHero from '../../components/academy/GamePageHero';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { setStoredProjectId } from '../../utils/projectSelection';

const LOOP_STEPS = [
    {
        key: 'campaigns',
        step: 1,
        icon: '🎬',
        title: 'Watch & learn',
        blurb: 'Enrol in academy campaigns with video lessons, checkpoints, and quizzes tied to this project.',
        cta: 'Browse campaigns',
        tone: 'indigo',
    },
    {
        key: 'lessons',
        step: 2,
        icon: '📖',
        title: 'Guided lessons',
        blurb: 'Read project-specific rubrics, examples, and standards before you rate live tasks.',
        cta: 'Open lessons',
        tone: 'teal',
    },
    {
        key: 'practice',
        step: 3,
        icon: '⚔️',
        title: 'Evaluation practice',
        blurb: 'Compare model responses side-by-side and submit verdicts in the evaluation studio.',
        cta: 'Start practice',
        tone: 'violet',
    },
    {
        key: 'arena',
        step: 4,
        icon: '🎮',
        title: 'Arena games',
        blurb: 'Sharpen reflexes with duels, spot-the-error, and other practice arena quests.',
        cta: 'Enter arena',
        tone: 'amber',
    },
    {
        key: 'assessment',
        step: 5,
        icon: '🏁',
        title: 'Readiness check',
        blurb: 'Run a timed assessment when you are ready to prove project readiness.',
        cta: 'Take assessment',
        tone: 'rose',
    },
];

export default function ProjectDetail() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const [projectData, programList, lessonList] = await Promise.all([
                    fetchProject(id),
                    fetchPrograms({ project_id: id }),
                    fetchProjectLessons(id),
                ]);
                setProject(projectData);
                setPrograms(programList ?? []);
                setLessons(lessonList ?? []);
                setStoredProjectId(projectData.id);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const featuredProgram = useMemo(
        () => programs.find((p) => p.featured) ?? programs[0] ?? null,
        [programs],
    );

    const stepLinks = useMemo(() => {
        const pid = project?.id;
        if (!pid) return {};

        return {
            campaigns: featuredProgram ? `/explore/${featuredProgram.id}` : '/explore',
            lessons: lessons.length ? `/lessons?project=${pid}` : `/lessons?project=${pid}`,
            practice: `/practice?project=${pid}`,
            arena: '/practice-arena',
            assessment: `/assessment?project=${pid}`,
        };
    }, [project, featuredProgram, lessons.length]);

    if (loading) return <LoadingState message="Loading your learning path…" />;
    if (error) return <ErrorAlert error={error} />;
    if (!project) return null;

    return (
        <div className="wb-gamehub-page wb-project-hub-page">
            <nav className="wb-project-hub-crumb" aria-label="Breadcrumb">
                <Link to="/projects">Training projects</Link>
                <span aria-hidden> / </span>
                <span>{project.name}</span>
            </nav>

            <GamePageHero
                eyebrow="Step 2 · Your learning path"
                title={project.name}
                subtitle={project.description}
                stats={[
                    { value: programs.length, label: 'Campaigns' },
                    { value: lessons.length, label: 'Lessons' },
                    { value: project.task_types?.length ?? 0, label: 'Task types' },
                ]}
            />

            {project.instructions && (
                <section className="wb-project-hub-brief">
                    <h2 className="wb-gamehub-section-title">
                        <span className="wb-gamehub-section-icon">📋</span>
                        Project brief
                    </h2>
                    <div className="wb-project-hub-brief-body">{project.instructions}</div>
                </section>
            )}

            <section className="wb-gamehub-section">
                <h2 className="wb-gamehub-section-title">
                    <span className="wb-gamehub-section-icon">🔁</span>
                    Recommended training loop
                </h2>
                <p className="wb-project-hub-loop-intro">
                    Work through these activities in order—or jump to what you need. Your focus stays saved on this
                    project across practice and assessments.
                </p>
                <ol className="wb-project-hub-loop">
                    {LOOP_STEPS.map((item) => (
                        <li key={item.key} className={`wb-project-hub-loop-card tone-${item.tone}`}>
                            <div className="wb-project-hub-loop-step">{item.step}</div>
                            <div className="wb-project-hub-loop-icon" aria-hidden>
                                {item.icon}
                            </div>
                            <div className="wb-project-hub-loop-body">
                                <h3>{item.title}</h3>
                                <p>{item.blurb}</p>
                                {item.key === 'campaigns' && programs.length > 0 && (
                                    <ul className="wb-project-hub-program-list">
                                        {programs.slice(0, 3).map((prog) => (
                                            <li key={prog.id}>
                                                <Link to={`/explore/${prog.id}`}>{prog.name}</Link>
                                            </li>
                                        ))}
                                        {programs.length > 3 && (
                                            <li className="text-muted">+{programs.length - 3} more campaigns</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                            <Link to={stepLinks[item.key]} className="btn wb-project-hub-loop-cta">
                                {item.cta} →
                            </Link>
                        </li>
                    ))}
                </ol>
            </section>

            {project.task_types?.length > 0 && (
                <section className="wb-gamehub-section">
                    <h2 className="wb-gamehub-section-title">
                        <span className="wb-gamehub-section-icon">🧩</span>
                        Task types you will evaluate
                    </h2>
                    <div className="row g-3">
                        {project.task_types.map((taskType) => (
                            <div className="col-md-6 col-lg-4" key={taskType.id}>
                                <div className="wb-project-hub-task-type">
                                    <div className="fw-semibold mb-1">{taskType.name}</div>
                                    <code className="small text-muted">{taskType.slug}</code>
                                    {taskType.schema?.description && (
                                        <p className="small text-muted mt-2 mb-0">{taskType.schema.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
