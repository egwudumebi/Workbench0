export const formatLabel = (value) => {
    if (!value) return '';
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

export const formatScore = (score) => {
    if (score == null) return '—';
    return `${Math.round(score)}%`;
};

export const readinessBadgeClass = (status) => {
    switch (status) {
        case 'ready':
            return 'wb-badge-ready';
        case 'nearly_ready':
            return 'wb-badge-nearly';
        case 'developing':
            return 'wb-badge-developing';
        case 'not_ready':
            return 'wb-badge-not-ready';
        default:
            return 'bg-secondary';
    }
};

export { getStoredProjectId, setStoredProjectId, selectDefaultProject } from './projectSelection';

export const lessonExcerpt = (content, maxLength = 140) => {
    if (!content) return '';

    const text = content
        .replace(/^#+\s+.+\n+/m, '')
        .replace(/[*_>`|]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}…`;
};

export const mistakeSeverityClass = (severity) => {
    switch (severity) {
        case 'critical':
            return 'wb-mistake-severity-critical';
        case 'high':
            return 'wb-mistake-severity-high';
        case 'medium':
            return 'wb-mistake-severity-medium';
        default:
            return 'wb-mistake-severity-low';
    }
};
