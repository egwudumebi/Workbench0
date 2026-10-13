export default function ReadinessRing({ value = 0, size = 120 }) {
    const pct = Math.min(100, Math.max(0, value));
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;

    const color = pct >= 85 ? '#059669' : pct >= 70 ? '#4f46e5' : pct >= 50 ? '#d97706' : '#dc2626';

    return (
        <div className="wb-readiness-ring" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <div className="wb-readiness-ring-value">
                <span>{Math.round(pct)}%</span>
                <span className="wb-readiness-ring-label">Ready</span>
            </div>
        </div>
    );
}
