const PANEL_KEYS = ['context', 'images', 'prompt', 'response_a', 'response_b'];

export function getTaskTypeDisplay(task) {
    return task?.task_type?.schema?.display ?? {};
}

export function shouldShowPanel(panelKey, task, display = getTaskTypeDisplay(task)) {
    const setting = display.panels?.[panelKey];
    if (setting === false || setting === 'never') return false;
    if (setting === true || setting === 'always') return true;
    if (setting === 'when_present') {
        return panelHasContent(panelKey, task);
    }

    return panelHasContent(panelKey, task);
}

export function panelLabel(panelKey, task, display = getTaskTypeDisplay(task)) {
    const labels = display.labels ?? {};
    if (labels[panelKey]) return labels[panelKey];

    if (panelKey === 'response_a' && task?.response_b) {
        return 'AI Response A';
    }

    return defaultPanelLabel(panelKey);
}

export function getFormConfig(task) {
    const schema = task?.task_type?.schema ?? {};
    const display = schema.display ?? {};
    const form = display.form ?? {};

    const decisionField = form.decision_field ?? 'decision';
    const explanationField = form.explanation_field ?? 'explanation';

    return {
        decisionField,
        explanationField,
        decisionStyle: form.decision_style ?? 'radio',
        decisionLabel: form.decision_label ?? schema.properties?.[decisionField]?.title ?? 'Your Decision',
        decisionProperty: schema.properties?.[decisionField] ?? {},
        explanationProperty: schema.properties?.[explanationField] ?? {},
        required: schema.required ?? [],
        configurationOptions: task?.configuration?.options ?? null,
    };
}

export function getDecisionOptions(task) {
    const form = getFormConfig(task);
    if (form.configurationOptions?.length) {
        return form.configurationOptions;
    }

    const enumValues = form.decisionProperty.enum;
    if (enumValues?.length) return enumValues;

    return ['correct', 'incorrect'];
}

function panelHasContent(panelKey, task) {
    switch (panelKey) {
        case 'context':
            return Boolean(getContextText(task?.context));
        case 'images':
            return Boolean(task?.context?.images?.length);
        case 'prompt':
            return Boolean(task?.prompt?.trim?.());
        case 'response_a':
            return Boolean(task?.response_a?.trim?.());
        case 'response_b':
            return Boolean(task?.response_b?.trim?.());
        default:
            return false;
    }
}

function defaultPanelLabel(panelKey) {
    switch (panelKey) {
        case 'context':
            return 'Context';
        case 'prompt':
            return 'Prompt';
        case 'response_a':
            return 'AI Response';
        case 'response_b':
            return 'AI Response B';
        default:
            return panelKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
}

export function getContextText(context) {
    if (!context) return null;
    if (typeof context === 'string') return context;

    const displayKeys = ['question', 'summary', 'notes', 'description'];
    for (const key of displayKeys) {
        if (typeof context[key] === 'string' && context[key].trim()) {
            return context[key];
        }
    }

    const { images, attachments, media, ...rest } = context;
    if (!Object.keys(rest).length) return null;

    return JSON.stringify(rest, null, 2);
}

export { PANEL_KEYS };
