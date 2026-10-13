import { useCallback, useState } from 'react';
import AdminConfirmDialog from '../components/admin/AdminConfirmDialog';

/**
 * @returns {{ confirm: (options: { title?: string, message: string, confirmLabel?: string, cancelLabel?: string, variant?: 'default'|'danger' }) => Promise<boolean>, dialog: import('react').ReactNode }}
 */
export function useAdminConfirm() {
    const [pending, setPending] = useState(null);

    const confirm = useCallback(
        ({ title, message, confirmLabel, cancelLabel, variant = 'default' }) =>
            new Promise((resolve) => {
                setPending({ title, message, confirmLabel, cancelLabel, variant, resolve });
            }),
        [],
    );

    const close = useCallback((result) => {
        setPending((current) => {
            current?.resolve(result);
            return null;
        });
    }, []);

    const dialog = (
        <AdminConfirmDialog
            open={Boolean(pending)}
            title={pending?.title}
            message={pending?.message ?? ''}
            confirmLabel={pending?.confirmLabel}
            cancelLabel={pending?.cancelLabel}
            variant={pending?.variant}
            onConfirm={() => close(true)}
            onCancel={() => close(false)}
        />
    );

    return { confirm, dialog };
}
