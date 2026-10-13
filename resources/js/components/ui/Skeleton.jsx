export default function Skeleton({ width = '100%', height = 16, className = '' }) {
    return (
        <div
            className={`wb-skeleton ${className}`}
            style={{ width, height, borderRadius: height > 20 ? 10 : 6 }}
        />
    );
}

export function DashboardSkeleton() {
    return (
        <div>
            <Skeleton width="240px" height={32} className="mb-2" />
            <Skeleton width="360px" height={16} className="mb-4" />
            <div className="row g-4">
                <div className="col-lg-4">
                    <Skeleton height={200} />
                </div>
                <div className="col-lg-8">
                    <Skeleton height={200} />
                </div>
            </div>
        </div>
    );
}
