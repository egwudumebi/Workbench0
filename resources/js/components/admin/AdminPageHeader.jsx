export default function AdminPageHeader({ eyebrow, title, subtitle, actions }) {
    return (
        <header className="wb-admin-page-head d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
            <div>
                {eyebrow && <p className="wb-admin-eyebrow">{eyebrow}</p>}
                <h1 className="wb-admin-title">{title}</h1>
                {subtitle && <p className="wb-admin-sub">{subtitle}</p>}
            </div>
            {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
        </header>
    );
}
