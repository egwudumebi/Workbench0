import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchProjectLessons } from '../../api/projects';
import MarkdownContent from '../../components/ui/MarkdownContent';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';

export default function LessonDetail() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const [lesson, setLesson] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!projectId) {
            setError('Project context is required.');
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const data = await fetchProjectLessons(projectId);
                setLessons(data ?? []);
                setLesson(data.find((l) => String(l.id) === String(id)) ?? null);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, projectId]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorAlert error={error} />;
    if (!lesson) return <ErrorAlert error="Lesson not found." />;

    const lessonIndex = lessons.findIndex((l) => String(l.id) === String(id));
    const prevLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
    const nextLesson = lessonIndex >= 0 && lessonIndex < lessons.length - 1
        ? lessons[lessonIndex + 1]
        : null;

    return (
        <div className="wb-lesson-detail">
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb wb-breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to={`/lessons?project=${projectId}`}>Lessons</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        {lesson.title}
                    </li>
                </ol>
            </nav>

            <article className="wb-card wb-lesson-article">
                <header className="wb-lesson-article-header">
                    <span className="wb-lesson-article-label">
                        Lesson {String(lessonIndex + 1).padStart(2, '0')}
                    </span>
                    <h1 className="wb-lesson-article-title">{lesson.title}</h1>
                </header>

                <MarkdownContent content={lesson.content} className="wb-lesson-content" />

                {lesson.examples?.length > 0 && (
                    <section className="wb-lesson-examples">
                        <h2 className="wb-lesson-examples-title">Worked Examples</h2>
                        {lesson.examples.map((example, index) => (
                            <div key={example.id} className="wb-lesson-example">
                                <h3 className="wb-lesson-example-title">
                                    Example {index + 1}: {example.title}
                                </h3>
                                <div className="wb-lesson-example-body">
                                    <MarkdownContent content={example.content} />
                                </div>
                            </div>
                        ))}
                    </section>
                )}
            </article>

            <footer className="wb-lesson-footer d-flex flex-wrap gap-2 justify-content-between align-items-center mt-4">
                <div className="d-flex flex-wrap gap-2">
                    {prevLesson && (
                        <Link
                            to={`/lessons/${prevLesson.id}?project=${projectId}`}
                            className="btn btn-outline-secondary"
                        >
                            ← Previous
                        </Link>
                    )}
                    {nextLesson && (
                        <Link
                            to={`/lessons/${nextLesson.id}?project=${projectId}`}
                            className="btn btn-outline-secondary"
                        >
                            Next →
                        </Link>
                    )}
                </div>
                <Link to="/practice" className="btn btn-primary">
                    Start Practice
                </Link>
            </footer>
        </div>
    );
}
