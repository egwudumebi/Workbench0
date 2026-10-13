import { useEffect, useId, useRef } from 'react';

export default function AdminConfirmDialog({
    open,
    title = 'Confirm',
    message,
    confirmLabel = 'Continue',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
}) {
    const titleId = useId();
    const descId = useId();
    const confirmRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const prev = document.activeElement;
        confirmRef.current?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            if (prev instanceof HTMLElement) prev.focus();
        };
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="wb-admin-confirm-root" role="presentation">
            <button type="button" className="wb-admin-confirm-backdrop" aria-label="Close dialog" onClick={onCancel} />
            <div
                className="wb-admin-confirm-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={message ? descId : undefined}
            >
                <h2 id={titleId} className="wb-admin-confirm-title">
                    {title}
                </h2>
                {message ? (
                    <p id={descId} className="wb-admin-confirm-message">
                        {message}
                    </p>
                ) : null}
                <div className="wb-admin-confirm-actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmRef}
                        type="button"
                        className={variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
