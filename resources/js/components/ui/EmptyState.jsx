export default function EmptyState({ title, description, action }) {
    return (
        <div className="text-center py-5">
            <div className="display-6 text-muted mb-2">📭</div>
            <h5 className="mb-2">{title}</h5>
            {description && <p className="text-muted mb-3">{description}</p>}
            {action}
        </div>
    );
}
