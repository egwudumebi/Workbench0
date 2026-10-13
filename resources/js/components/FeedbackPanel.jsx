import ScoreBar from './ui/ScoreBar';
import { formatLabel } from '../utils/format';

export default function FeedbackPanel({ evaluation }) {
    if (!evaluation) return null;

    const feedback = evaluation.feedback;
    const isObject = feedback && typeof feedback === 'object';
    const variant = evaluation.passed ? 'feedback-success' : 'feedback-warning';

    return (
        <div className={`feedback-panel wb-card-flat mt-4 ${variant}`}>
            <div className="feedback-header">
                <h5 className="mb-0 fw-semibold">Evaluation Result</h5>
                <span className={`badge ${evaluation.passed ? 'wb-badge-ready' : 'wb-badge-not-ready'}`}>
                    {evaluation.result_label ?? (evaluation.passed ? 'Passed' : 'Needs Work')}
                </span>
                <span className="badge bg-light text-dark border ms-auto">
                    {Math.round(evaluation.score)}%
                </span>
            </div>

            {isObject && feedback.summary && (
                <div className="feedback-section">
                    <div className="feedback-section-title">Summary</div>
                    <p className="feedback-section-body fw-medium">{feedback.summary}</p>
                </div>
            )}

            {isObject && feedback.what_went_well && (
                <div className="feedback-section">
                    <div className="feedback-section-title">What you did well</div>
                    <p className="feedback-section-body">{feedback.what_went_well}</p>
                </div>
            )}

            {isObject && feedback.what_was_missed && (
                <div className="feedback-section">
                    <div className="feedback-section-title">What you missed</div>
                    <p className="feedback-section-body">{feedback.what_was_missed}</p>
                </div>
            )}

            {isObject && feedback.why_it_matters && (
                <div className="feedback-section">
                    <div className="feedback-section-title">Why it matters</div>
                    <p className="feedback-section-body">{feedback.why_it_matters}</p>
                </div>
            )}

            {isObject && feedback.how_to_improve && (
                <div className="feedback-section">
                    <div className="feedback-section-title">How to improve</div>
                    <p className="feedback-section-body">{feedback.how_to_improve}</p>
                </div>
            )}

            {!isObject && feedback && (
                <div className="feedback-section">
                    <p className="feedback-section-body mb-0">{feedback}</p>
                </div>
            )}

            {evaluation.criterion_scores?.length > 0 && (
                <div className="feedback-section">
                    <div className="feedback-section-title mb-3">Criterion Breakdown</div>
                    {evaluation.criterion_scores.map((c) => (
                        <div key={c.criterion} className="mb-3">
                            <ScoreBar
                                label={formatLabel(c.criterion)}
                                value={c.score}
                                variant={c.passed ? 'success' : 'danger'}
                            />
                            {c.reason && <small className="text-muted d-block mt-1">{c.reason}</small>}
                        </div>
                    ))}
                </div>
            )}

            {evaluation.mistakes?.length > 0 && (
                <div className="feedback-section">
                    <div className="feedback-section-title mb-2">Detected Issues</div>
                    {evaluation.mistakes.map((mistake, idx) => (
                        <div key={idx} className="d-flex gap-2 align-items-start mb-2">
                            <span className="badge wb-badge-nearly flex-shrink-0">
                                {formatLabel(mistake.category ?? 'issue')}
                            </span>
                            <span className="small">{mistake.description}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
