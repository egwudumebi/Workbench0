import { useEffect, useState } from 'react';
import {
    createAdminCheckpoint,
    createAdminQuizQuestion,
    deleteAdminCheckpoint,
    deleteAdminQuizQuestion,
    upsertAdminLessonQuiz,
    updateAdminCheckpoint,
    updateAdminQuizQuestion,
} from '../../api/admin';
import { useAdminConfirm } from '../../hooks/useAdminConfirm';

function optionsToText(options) {
    return (options ?? []).join('\n');
}

function textToOptions(text) {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
}

const EMPTY_CHECKPOINT = {
    timestamp_seconds: 0,
    question: '',
    optionsText: 'Option A\nOption B',
    correct_answer: '',
    explanation: '',
};

const EMPTY_QUESTION = {
    question: '',
    optionsText: 'Option A\nOption B',
    correct_answer: '',
    explanation: '',
};

export default function LessonInteractiveEditor({ lessonId, lessonDetail, onReload }) {
    const [checkpointForm, setCheckpointForm] = useState(EMPTY_CHECKPOINT);
    const [editingCheckpointId, setEditingCheckpointId] = useState(null);
    const [quizTitle, setQuizTitle] = useState('Knowledge Check');
    const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION);
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [busy, setBusy] = useState(false);
    const { confirm, dialog } = useAdminConfirm();

    useEffect(() => {
        setQuizTitle(lessonDetail?.quiz?.title ?? 'Knowledge Check');
    }, [lessonDetail?.quiz?.title, lessonId]);

    const checkpoints = lessonDetail?.checkpoints ?? [];
    const quiz = lessonDetail?.quiz;
    const questions = quiz?.questions ?? [];

    const saveCheckpoint = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const payload = {
                timestamp_seconds: Number(checkpointForm.timestamp_seconds),
                question: checkpointForm.question,
                options: textToOptions(checkpointForm.optionsText),
                correct_answer: checkpointForm.correct_answer,
                explanation: checkpointForm.explanation || null,
            };
            if (editingCheckpointId) {
                await updateAdminCheckpoint(editingCheckpointId, payload);
            } else {
                await createAdminCheckpoint(lessonId, payload);
            }
            setCheckpointForm(EMPTY_CHECKPOINT);
            setEditingCheckpointId(null);
            await onReload();
        } finally {
            setBusy(false);
        }
    };

    const editCheckpoint = (cp) => {
        setEditingCheckpointId(cp.id);
        setCheckpointForm({
            timestamp_seconds: cp.timestamp_seconds,
            question: cp.question,
            optionsText: optionsToText(cp.options),
            correct_answer: cp.correct_answer,
            explanation: cp.explanation ?? '',
        });
    };

    const removeCheckpoint = async (id) => {
        const ok = await confirm({
            title: 'Delete checkpoint?',
            message: 'Delete this video checkpoint? Learners will no longer see this pause question.',
            confirmLabel: 'Delete checkpoint',
            variant: 'danger',
        });
        if (!ok) return;
        await deleteAdminCheckpoint(id);
        await onReload();
    };

    const saveQuizMeta = async () => {
        setBusy(true);
        try {
            await upsertAdminLessonQuiz(lessonId, { title: quizTitle });
            await onReload();
        } finally {
            setBusy(false);
        }
    };

    const saveQuestion = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const payload = {
                question: questionForm.question,
                options: textToOptions(questionForm.optionsText),
                correct_answer: questionForm.correct_answer,
                explanation: questionForm.explanation || null,
            };
            if (editingQuestionId) {
                await updateAdminQuizQuestion(editingQuestionId, payload);
            } else {
                let quizId = quiz?.id;
                if (!quizId) {
                    const created = await upsertAdminLessonQuiz(lessonId, { title: quizTitle });
                    quizId = created.id;
                }
                await createAdminQuizQuestion(quizId, payload);
            }
            setQuestionForm(EMPTY_QUESTION);
            setEditingQuestionId(null);
            await onReload();
        } finally {
            setBusy(false);
        }
    };

    const editQuestion = (q) => {
        setEditingQuestionId(q.id);
        setQuestionForm({
            question: q.question,
            optionsText: optionsToText(q.options),
            correct_answer: q.correct_answer,
            explanation: q.explanation ?? '',
        });
    };

    const removeQuestion = async (id) => {
        const ok = await confirm({
            title: 'Delete question?',
            message: 'Delete this quiz question? This cannot be undone.',
            confirmLabel: 'Delete question',
            variant: 'danger',
        });
        if (!ok) return;
        await deleteAdminQuizQuestion(id);
        await onReload();
    };

    return (
        <>
        <div className="mt-4 pt-3 border-top">
            <h3 className="h6 fw-bold mb-3">Video checkpoints</h3>
            {checkpoints.length > 0 && (
                <ul className="list-unstyled mb-3">
                    {checkpoints.map((cp) => (
                        <li key={cp.id} className="d-flex flex-wrap justify-content-between gap-2 mb-2 p-2 bg-light rounded">
                            <span>
                                <strong>{cp.timestamp_seconds}s</strong> — {cp.question}
                            </span>
                            <span>
                                <button type="button" className="btn btn-sm btn-link" onClick={() => editCheckpoint(cp)}>
                                    Edit
                                </button>
                                <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => removeCheckpoint(cp.id)}>
                                    Delete
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            <form className="row g-2 mb-4" onSubmit={saveCheckpoint}>
                <div className="col-md-2">
                    <input
                        type="number"
                        min={0}
                        className="form-control form-control-sm"
                        placeholder="Sec"
                        value={checkpointForm.timestamp_seconds}
                        onChange={(e) => setCheckpointForm({ ...checkpointForm, timestamp_seconds: e.target.value })}
                        required
                    />
                </div>
                <div className="col-md-10">
                    <input
                        className="form-control form-control-sm"
                        placeholder="Checkpoint question"
                        value={checkpointForm.question}
                        onChange={(e) => setCheckpointForm({ ...checkpointForm, question: e.target.value })}
                        required
                    />
                </div>
                <div className="col-md-6">
                    <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        placeholder="Options (one per line)"
                        value={checkpointForm.optionsText}
                        onChange={(e) => setCheckpointForm({ ...checkpointForm, optionsText: e.target.value })}
                        required
                    />
                </div>
                <div className="col-md-6">
                    <input
                        className="form-control form-control-sm mb-2"
                        placeholder="Correct answer (exact match)"
                        value={checkpointForm.correct_answer}
                        onChange={(e) => setCheckpointForm({ ...checkpointForm, correct_answer: e.target.value })}
                        required
                    />
                    <input
                        className="form-control form-control-sm"
                        placeholder="Explanation (optional)"
                        value={checkpointForm.explanation}
                        onChange={(e) => setCheckpointForm({ ...checkpointForm, explanation: e.target.value })}
                    />
                </div>
                <div className="col-12">
                    <button type="submit" className="btn btn-sm btn-outline-primary" disabled={busy}>
                        {editingCheckpointId ? 'Update checkpoint' : 'Add checkpoint'}
                    </button>
                    {editingCheckpointId && (
                        <button
                            type="button"
                            className="btn btn-sm btn-link"
                            onClick={() => {
                                setEditingCheckpointId(null);
                                setCheckpointForm(EMPTY_CHECKPOINT);
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <h3 className="h6 fw-bold mb-2">End-of-lesson quiz</h3>
            <div className="d-flex gap-2 mb-3">
                <input
                    className="form-control form-control-sm"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="Quiz title"
                />
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={saveQuizMeta} disabled={busy}>
                    Save quiz
                </button>
            </div>
            {questions.length > 0 && (
                <ul className="list-unstyled mb-3">
                    {questions.map((q) => (
                        <li key={q.id} className="mb-2 p-2 bg-light rounded">
                            <div className="d-flex justify-content-between gap-2">
                                <span>{q.question}</span>
                                <span>
                                    <button type="button" className="btn btn-sm btn-link" onClick={() => editQuestion(q)}>
                                        Edit
                                    </button>
                                    <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => removeQuestion(q.id)}>
                                        Delete
                                    </button>
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <form className="row g-2" onSubmit={saveQuestion}>
                <div className="col-12">
                    <input
                        className="form-control form-control-sm"
                        placeholder="Quiz question"
                        value={questionForm.question}
                        onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                        required
                    />
                </div>
                <div className="col-md-6">
                    <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        placeholder="Options (one per line)"
                        value={questionForm.optionsText}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionsText: e.target.value })}
                        required
                    />
                </div>
                <div className="col-md-6">
                    <input
                        className="form-control form-control-sm mb-2"
                        placeholder="Correct answer"
                        value={questionForm.correct_answer}
                        onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                        required
                    />
                    <input
                        className="form-control form-control-sm"
                        placeholder="Explanation"
                        value={questionForm.explanation}
                        onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    />
                </div>
                <div className="col-12">
                    <button type="submit" className="btn btn-sm btn-outline-primary" disabled={busy}>
                        {editingQuestionId ? 'Update question' : 'Add question'}
                    </button>
                </div>
            </form>
        </div>
        {dialog}
        </>
    );
}
