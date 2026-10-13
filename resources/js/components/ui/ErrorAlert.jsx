export default function ErrorAlert({ error, onDismiss, className = '' }) {
    if (!error) return null;

    const message =
        typeof error === 'string'
            ? error
            : error.response?.data?.message ??
              Object.values(error.response?.data?.errors ?? {})
                  .flat()
                  .join(' ') ??
              'Something went wrong.';

    return (
        <div className={`alert alert-danger alert-dismissible fade show ${className}`.trim()} role="alert">
            {message}
            {onDismiss && (
                <button type="button" className="btn-close" aria-label="Close" onClick={onDismiss} />
            )}
        </div>
    );
}
