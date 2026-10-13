export default function ScoreBar({ value = 0, max = 100, label, showValue = true, variant = 'primary' }) {
    const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

    return (
        <div>
            {(label || showValue) && (
                <div className="d-flex justify-content-between small mb-1">
                    {label && <span className="text-muted">{label}</span>}
                    {showValue && <span className="fw-semibold">{Math.round(pct)}%</span>}
                </div>
            )}
            <div className="wb-score-bar">
                <div
                    className={`wb-score-bar-fill bg-${variant}`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
        </div>
    );
}
