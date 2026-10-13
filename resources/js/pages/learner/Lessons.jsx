import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchProjectLessons, fetchProjects } from '../../api/projects';
import PageHeader from '../../components/ui/PageHeader';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import { lessonExcerpt } from '../../utils/format';
import { selectDefaultProject, setStoredProjectId } from '../../utils/projectSelection';

export default function Lessons() {
    const [searchParams] = useSearchParams();
    const projectParam = searchParams.get('project');
    const [projectId, setProjectId] = useState(projectParam);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                let id = projectParam;
                if (!id) {
                    const response = await fetchProjects();
                    const selected = selectDefaultProject(response.data);
                    id = selected?.id;
                    if (!cancelled) {
                        setProjectId(String(id));
                        if (id) setStoredProjectId(id);
                    }
                }
                if (!id) {
                    if (!cancelled) setLessons([]);
                    return;
                }
                const data = await fetchProjectLessons(id);
                if (!cancelled) setLessons(data ?? []);
            } catch (err) {
                if (!cancelled) setError(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [projectParam]);

    if (loading) return <LoadingState message="Loading lessons…" />;
    if (error) return <ErrorAlert error={error} />;

    return (
        <div>
            <PageHeader
                title="Lessons"
                subtitle="Build evaluator fundamentals before you practice and assess."
            />

            {!lessons.length ? (
                <EmptyState title="No lessons yet" description="Lessons will appear here when published." />
            ) : (
                <div className="row g-3">
                    {lessons.map((lesson, index) => (
                        <div key={lesson.id} className="col-12 col-md-6 col-xl-4">
                            <Link
                                to={`/lessons/${lesson.id}?project=${projectId}`}
                                className="wb-lesson-card wb-card h-100 text-decoration-none"
                            >
                                <div className="wb-lesson-card-index">
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                                <h2 className="wb-lesson-card-title">{lesson.title}</h2>
                                <p className="wb-lesson-card-excerpt">
                                    {lessonExcerpt(lesson.content)}
                                </p>
                                <div className="wb-lesson-card-meta">
                                    <span>{lesson.examples?.length ?? 0} examples</span>
                                    <span className="wb-lesson-card-arrow" aria-hidden="true">→</span>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
