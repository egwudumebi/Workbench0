import { useEffect, useRef, useState } from 'react';
import MarkdownContent from '../ui/MarkdownContent';

export default function LessonVideoPlayer({ lesson, checkpoints = [], onCheckpoint }) {
    const videoRef = useRef(null);
    const [activeCheckpoint, setActiveCheckpoint] = useState(null);
    const [checkpointAnswer, setCheckpointAnswer] = useState('');
    const [checkpointResult, setCheckpointResult] = useState(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !checkpoints.length) return undefined;

        const handler = () => {
            const hit = checkpoints.find(
                (cp) => !cp.answered && video.currentTime >= cp.timestamp_seconds && video.currentTime < cp.timestamp_seconds + 1.5,
            );
            if (hit && activeCheckpoint?.id !== hit.id) {
                video.pause();
                setActiveCheckpoint(hit);
                setCheckpointResult(null);
                setCheckpointAnswer('');
            }
        };

        video.addEventListener('timeupdate', handler);
        return () => video.removeEventListener('timeupdate', handler);
    }, [checkpoints, activeCheckpoint]);

    const submitCheckpoint = async () => {
        if (!activeCheckpoint || !checkpointAnswer) return;
        const result = await onCheckpoint(activeCheckpoint.id, checkpointAnswer);
        setCheckpointResult(result);
        setActiveCheckpoint(null);
        videoRef.current?.play();
    };

    if (!lesson.video_url) {
        return (
            <div className="wb-narrated-lesson border rounded-3 p-4 mb-4" style={{ background: 'var(--wb-accent-soft)' }}>
                <div className="small text-uppercase text-muted mb-2">Narrated lesson</div>
                <p className="mb-3">{lesson.transcript?.replace(/WEBVTT[\s\S]*?-->[^\n]+\n/g, '')?.trim() || lesson.summary}</p>
                {lesson.caption_url && (
                    <a href={lesson.caption_url} className="small" target="_blank" rel="noreferrer">View captions</a>
                )}
            </div>
        );
    }

    return (
        <div className="mb-4">
            <video ref={videoRef} className="w-100 rounded-3" controls playsInline src={lesson.video_url}>
                {lesson.caption_url && <track kind="captions" src={lesson.caption_url} label="English" />}
            </video>

            {activeCheckpoint && (
                <div className="wb-card p-4 mt-3 border-primary">
                    <h3 className="h6">Checkpoint</h3>
                    <p>{activeCheckpoint.question}</p>
                    <div className="d-flex flex-column gap-2">
                        {(activeCheckpoint.options ?? []).map((option) => (
                            <label key={option} className="form-check">
                                <input
                                    type="radio"
                                    className="form-check-input"
                                    name="checkpoint"
                                    checked={checkpointAnswer === option}
                                    onChange={() => setCheckpointAnswer(option)}
                                />
                                <span className="form-check-label">{option}</span>
                            </label>
                        ))}
                    </div>
                    <button type="button" className="btn btn-primary btn-sm mt-2" onClick={submitCheckpoint} disabled={!checkpointAnswer}>
                        Submit
                    </button>
                </div>
            )}

            {checkpointResult && (
                <div className={`alert mt-3 ${checkpointResult.is_correct ? 'alert-success' : 'alert-warning'}`}>
                    {checkpointResult.is_correct ? 'Correct.' : 'Not quite.'} {checkpointResult.explanation}
                </div>
            )}
        </div>
    );
}

export function LessonContentPanel({ lesson }) {
    return (
        <div>
            <LessonVideoPlayer lesson={lesson} checkpoints={[]} onCheckpoint={async () => {}} />
            <MarkdownContent content={lesson.content} />
        </div>
    );
}
