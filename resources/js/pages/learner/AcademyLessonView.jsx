import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    fetchAcademyLesson,
    submitCheckpoint,
    submitQuiz,
    updateLessonProgress,
} from '../../api/academy';
import LessonVideoPlayer from '../../components/academy/LessonVideoPlayer';
import MarkdownContent from '../../components/ui/MarkdownContent';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';

export default function AcademyLessonView() {
    const { id } = useParams();
    const [payload, setPayload] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = async () => {
        setPayload(await fetchAcademyLesson(id));
    };

    useEffect(() => {
        (async () => {
            try {
                await load();
                await updateLessonProgress(id, { status: 'in_progress' });
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorAlert error={error} />;
    if (!payload) return null;

    const { lesson, progress } = payload;
    const checkpoints = lesson.checkpoints ?? [];
    const quiz = lesson.quiz;

    const handleComplete = async () => {
        await updateLessonProgress(id, { status: 'completed' });
        await load();
    };

    const handleQuizSubmit = async (e) => {
        e.preventDefault();
        if (!quiz) return;
        const result = await submitQuiz(quiz.id, quizAnswers);
        setQuizResult(result);
        if (result.passed) {
            await handleComplete();
        }
    };

    return (
        <div>
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/explore">Explore Academy</Link></li>
                    <li className="breadcrumb-item active">{lesson.title}</li>
                </ol>
            </nav>

            <div className="wb-card p-4">
                <h1 className="h3 mb-1">{lesson.title}</h1>
                <p className="text-muted">{lesson.summary}</p>

                <LessonVideoPlayer
                    lesson={lesson}
                    checkpoints={checkpoints}
                    onCheckpoint={async (checkpointId, answer) => submitCheckpoint(checkpointId, answer)}
                />

                {!lesson.video_url && checkpoints.length > 0 && (
                    <div className="border rounded-3 p-3 mb-4">
                        <h3 className="h6">Lesson checkpoints</h3>
                        {checkpoints.map((cp) => (
                            <NarratedCheckpoint key={cp.id} checkpoint={cp} onSubmit={submitCheckpoint} />
                        ))}
                    </div>
                )}

                <MarkdownContent content={lesson.content} />

                {quiz && (
                    <form onSubmit={handleQuizSubmit} className="mt-4 border-top pt-4">
                        <h2 className="h5">{quiz.title}</h2>
                        {quiz.questions?.map((q) => (
                            <div key={q.id} className="mb-3">
                                <div className="fw-semibold mb-2">{q.question}</div>
                                {(q.options ?? []).map((opt) => (
                                    <label key={opt} className="form-check">
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            name={`q-${q.id}`}
                                            checked={quizAnswers[q.id] === opt}
                                            onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                                        />
                                        <span className="form-check-label">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ))}
                        <button type="submit" className="btn btn-primary">Submit quiz</button>
                        {quizResult && (
                            <div className={`alert mt-3 ${quizResult.passed ? 'alert-success' : 'alert-warning'}`}>
                                Score: {quizResult.score_percent}% — {quizResult.passed ? 'Passed' : 'Try again'}
                            </div>
                        )}
                    </form>
                )}

                {!quiz && (
                    <button type="button" className="btn btn-primary mt-4" onClick={handleComplete} disabled={progress?.status === 'completed'}>
                        {progress?.status === 'completed' ? 'Completed' : 'Mark lesson complete'}
                    </button>
                )}
            </div>
        </div>
    );
}

function NarratedCheckpoint({ checkpoint, onSubmit }) {
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState(null);

    return (
        <div className="mb-3 pb-3 border-bottom">
            <p className="mb-2">{checkpoint.question}</p>
            {(checkpoint.options ?? []).map((opt) => (
                <label key={opt} className="form-check">
                    <input type="radio" className="form-check-input" checked={answer === opt} onChange={() => setAnswer(opt)} />
                    <span className="form-check-label">{opt}</span>
                </label>
            ))}
            <button
                type="button"
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={async () => {
                    const res = await onSubmit(checkpoint.id, answer);
                    setResult(res);
                }}
                disabled={!answer}
            >
                Check answer
            </button>
            {result && (
                <div className={`small mt-2 ${result.is_correct ? 'text-success' : 'text-warning'}`}>
                    {result.explanation}
                </div>
            )}
        </div>
    );
}
