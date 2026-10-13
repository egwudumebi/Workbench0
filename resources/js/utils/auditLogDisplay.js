import { formatDate, formatLabel } from './format';

const ENTITY_LABELS = {
    PracticeChallenge: 'Practice challenge',
    Task: 'Task',
    Project: 'Training project',
    TrainingProgram: 'Programme',
    TrainingModule: 'Module',
    Lesson: 'Lesson',
    ProgramEnrolment: 'Enrolment',
    TaskType: 'Task type',
    VideoCheckpoint: 'Video checkpoint',
    QuizQuestion: 'Quiz question',
};

const SUMMARY_KEYS = ['title', 'name', 'slug', 'status', 'active', 'mode', 'difficulty', 'email'];

export function auditEntityLabel(entityType) {
    if (!entityType) return '—';
    const short = entityType.split('\\').pop() ?? entityType;
    return ENTITY_LABELS[short] ?? formatLabel(short);
}

export function auditActionTone(action) {
    const a = (action ?? '').toLowerCase();
    if (a.includes('deleted') || a.includes('unenrolled')) return 'danger';
    if (a.includes('created')) return 'success';
    if (a.includes('updated')) return 'info';
    return 'neutral';
}

export function formatAuditWhen(iso) {
    if (!iso) return { relative: '—', full: '' };
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    let relative;
    if (diffMins < 1) relative = 'Just now';
    else if (diffMins < 60) relative = `${diffMins}m ago`;
    else {
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 48) relative = `${diffHours}h ago`;
        else {
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 14) relative = `${diffDays}d ago`;
            else relative = formatDate(iso);
        }
    }
    return { relative, full: formatDate(iso) };
}

function pickSummaryFields(record) {
    if (!record || typeof record !== 'object') return [];
    return SUMMARY_KEYS.filter((key) => record[key] != null && record[key] !== '').map((key) => ({
        key,
        value: record[key],
    }));
}

export function auditChangeSummary(log) {
    const action = (log.action ?? '').toLowerCase();
    const before = log.before;
    const after = log.after;

    if (action.includes('deleted') || action.includes('unenrolled')) {
        const fields = pickSummaryFields(before);
        if (fields.length === 0) return 'Removed from the system.';
        return fields.map(({ key, value }) => `${formatLabel(key)}: ${value}`).join(' · ');
    }

    if (action.includes('created')) {
        const fields = pickSummaryFields(after);
        if (fields.length === 0) return 'New record created.';
        return fields.map(({ key, value }) => `${formatLabel(key)}: ${value}`).join(' · ');
    }

    if (before && after) {
        const lines = [];
        for (const key of SUMMARY_KEYS) {
            if (before[key] === undefined && after[key] === undefined) continue;
            const from = before[key];
            const to = after[key];
            if (JSON.stringify(from) !== JSON.stringify(to)) {
                lines.push(`${formatLabel(key)}: ${from ?? '—'} → ${to ?? '—'}`);
            }
        }
        if (lines.length > 0) return lines.join(' · ');
    }

    if (after) {
        const fields = pickSummaryFields(after);
        if (fields.length > 0) {
            return fields.map(({ key, value }) => `${formatLabel(key)}: ${value}`).join(' · ');
        }
    }

    return null;
}

export function auditHasDetail(log) {
    return Boolean(
        (log.before && Object.keys(log.before).length > 0) ||
            (log.after && Object.keys(log.after).length > 0),
    );
}

export const AUDIT_ACTION_FILTERS = [
    { id: '', label: 'All actions' },
    { id: 'created', label: 'Created' },
    { id: 'updated', label: 'Updated' },
    { id: 'deleted', label: 'Deleted' },
];
