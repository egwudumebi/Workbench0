import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { enrolProgram, fetchProgram, fetchProgramProgress } from '../../api/academy';
import LearningMap from '../../components/academy/LearningMap';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { useAcademyStats } from '../../context/AcademyStatsContext';

const LESSON_XP = 50;

const THEMES = [
    { className: 'wb-campaign-theme-indigo', icon: '🎓' },
    { className: 'wb-campaign-theme-teal', icon: '⚖️' },
    { className: 'wb-campaign-theme-amber', icon: '🧠' },
];

function formatDifficulty(value) {
    if (!value) return 'All levels';
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function formatSource(value) {
    if (!value) return null;
    return String(value).replace(/_/g, ' ');
}

function lessonStatus(lessonId, progress) {
    return progress[lessonId] ?? 'not_started';
}

export default function ProgramDetail() {
    const { id } = useParams();
    const { stats: academy } = useAcademyStats();
    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrolling, setEnrolling] = useState(false);
    const [enrolled, setEnrolled] = useState(false);
    const [lessonProgress, setLessonProgress] = useState({});

    useEffect(() => {
        (async () => {
            try {
                setProgram(await fetchProgram(id));
                setLessonProgress(await fetchProgramProgress(id));
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    useEffect(() => {
        const match = academy?.enrolments?.some((e) => String(e.training_program_id) === String(id));
        if (match) setEnrolled(true);
    }, [academy, id]);

    const theme = THEMES[(Number(id) || 0) % THEMES.length];

    const flatLessons = useMemo(() => {
        const list = [];
        (program?.modules ?? []).forEach((m) => {
            (m.lessons ?? []).forEach((l) => list.push({ ...l, moduleTitle: m.title }));
        });
        return list;
    }, [program]);

    const mapStats = useMemo(() => {
        const total = flatLessons.length;
        const cleared = flatLessons.filter((l) => lessonProgress[l.id] === 'completed').length;
        const pct = total ? Math.round((cleared / total) * 100) : 0;
        return { total, cleared, pct };
    }, [flatLessons, lessonProgress]);

    const continueLesson = useMemo(() => {
        const inProgress = flatLessons.find((l) => lessonProgress[l.id] === 'in_progress');
        if (inProgress) return inProgress;
        const next = flatLessons.find((l) => {
            const s = lessonProgress[l.id];
            return s !== 'completed';
        });
        return next ?? flatLessons[0];
    }, [flatLessons, lessonProgress]);

    const handleEnrol = async () => {
        setEnrolling(true);
        try {
            await enrolProgram(id);
            setEnrolled(true);
        } catch (err) {
            setError(err);
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) return <LoadingState />;
    if (error && !program) return <ErrorAlert error={error} />;
    if (!program) return null;

    const source = formatSource(program.source_classification);
    const moduleCount = program.modules?.length ?? 0;
    const lessonCount = flatLessons.length;

    return (
        <div className="wb-campaign-page">
            <nav className="wb-campaign-crumb" aria-label="Breadcrumb">
                <Link to="/explore">← Explore Academy</Link>
                <span className="wb-campaign-crumb-sep">/</span>
                <span>{program.name}</span>
            </nav>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <section className={`wb-campaign-hero ${theme.className}`}>
                <div className="wb-campaign-hero-art" aria-hidden>
                    <span className="wb-campaign-hero-icon">{theme.icon}</span>
                </div>
                <div className="wb-campaign-hero-body">
                    <div className="wb-campaign-hero-badges">
                        <span className="wb-campaign-badge diff">{formatDifficulty(program.difficulty)}</span>
                        {program.featured && <span className="wb-campaign-badge featured">Featured</span>}
                        {enrolled && <span className="wb-campaign-badge enrolled">Enrolled</span>}
                    </div>
                    <h1 className="wb-campaign-hero-title">{program.name}</h1>
                    <p className="wb-campaign-hero-audience">{program.audience}</p>
                    <p className="wb-campaign-hero-desc">{program.description}</p>
                    <div className="wb-campaign-hero-meta">
                        <span>⏱ {program.estimated_hours}h</span>
                        <span>📦 {moduleCount} modules</span>
                        <span>📚 {lessonCount} lessons</span>
                        <span className="wb-campaign-xp-hint">+{LESSON_XP} XP per lesson</span>
                    </div>
                    {mapStats.total > 0 && (
                        <div className="wb-campaign-hero-progress">
                            <div className="wb-gamehub-progress-head">
                                <span>Campaign clearance</span>
                                <span>{mapStats.pct}%</span>
                            </div>
                            <div className="wb-gamehub-progress-bar">
                                <div className="wb-gamehub-progress-fill gold" style={{ width: `${mapStats.pct}%` }} />
                            </div>
                        </div>
                    )}
                    <div className="wb-campaign-hero-actions">
                        {continueLesson && (
                            <Link to={`/academy-lessons/${continueLesson.id}`} className="btn wb-campaign-btn-play">
                                {mapStats.cleared > 0 ? 'Continue campaign' : 'Start first lesson'}
                            </Link>
                        )}
                        {!enrolled && (
                            <button
                                type="button"
                                className="btn wb-campaign-btn-enrol"
                                onClick={handleEnrol}
                                disabled={enrolling}
                            >
                                {enrolling ? 'Enrolling…' : 'Enrol & track progress'}
                            </button>
                        )}
                    </div>
                    {(program.last_reviewed_at || source) && (
                        <p className="wb-campaign-hero-footnote">
                            {program.last_reviewed_at && <>Reviewed {program.last_reviewed_at}</>}
                            {program.last_reviewed_at && source && ' · '}
                            {source && <span className="text-capitalize">{source}</span>}
                        </p>
                    )}
                </div>
            </section>

            {program.learning_objectives?.length > 0 && (
                <section className="wb-campaign-objectives">
                    <h2 className="wb-campaign-section-label">Mission objectives</h2>
                    <ul className="wb-campaign-objective-list">
                        {program.learning_objectives.map((o) => (
                            <li key={o}>{o}</li>
                        ))}
                    </ul>
                </section>
            )}

            <section className="wb-program-map-section">
                <LearningMap
                    modules={program.modules ?? []}
                    lessonProgress={lessonProgress}
                    continueLessonId={continueLesson?.id}
                />
            </section>

            <section className="wb-campaign-quest-log">
                <h2 className="wb-campaign-section-label">Quest log — all lessons</h2>
                {program.modules?.map((module) => (
                    <div key={module.id} className="wb-campaign-module-block">
                        <h3 className="wb-campaign-module-title">{module.title}</h3>
                        {module.description && (
                            <p className="wb-campaign-module-desc">{module.description}</p>
                        )}
                        <ul className="wb-campaign-lesson-list">
                            {module.lessons?.map((lesson) => {
                                const status = lessonStatus(lesson.id, lessonProgress);
                                return (
                                    <li key={lesson.id}>
                                        <Link
                                            to={`/academy-lessons/${lesson.id}`}
                                            className={`wb-campaign-lesson-row ${status}`}
                                        >
                                            <span className="wb-campaign-lesson-status" aria-hidden>
                                                {status === 'completed' && '✓'}
                                                {status === 'in_progress' && '▶'}
                                                {status === 'not_started' && '○'}
                                            </span>
                                            <span className="wb-campaign-lesson-title">{lesson.title}</span>
                                            {lesson.estimated_minutes && (
                                                <span className="wb-campaign-lesson-time">{lesson.estimated_minutes} min</span>
                                            )}
                                            <span className="wb-campaign-lesson-xp">+{LESSON_XP} XP</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </section>
        </div>
    );
}
