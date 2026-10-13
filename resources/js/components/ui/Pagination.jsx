export default function Pagination({ page, lastPage, onPageChange, className = '' }) {
    if (!lastPage || lastPage <= 1) return null;

    return (
        <nav className={className} aria-label="Pagination">
            <ul className="pagination wb-pagination mb-0">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                    <button
                        type="button"
                        className="page-link"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                    >
                        Previous
                    </button>
                </li>
                <li className="page-item disabled">
                    <span className="page-link">Page {page} of {lastPage}</span>
                </li>
                <li className={`page-item ${page >= lastPage ? 'disabled' : ''}`}>
                    <button
                        type="button"
                        className="page-link"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= lastPage}
                    >
                        Next
                    </button>
                </li>
            </ul>
        </nav>
    );
}
