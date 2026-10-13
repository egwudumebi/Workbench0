export default function StatCard({ label, value, hint, accent, className = '' }) {
    return (
        <div className={`wb-stat-card h-100 d-flex flex-column ${className}`.trim()}>
            <div className="wb-stat-label mb-2">{label}</div>
            <div className="wb-stat-value" style={accent ? { color: accent } : undefined}>
                {value}
            </div>
            <div className="wb-stat-hint small text-muted mt-auto pt-1">
                {hint || '\u00A0'}
            </div>
        </div>
    );
}
