export default function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="wb-page-header d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
                <h1 className="wb-page-title">{title}</h1>
                {subtitle && <p className="wb-page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}
