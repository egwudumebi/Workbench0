import { useEffect, useMemo } from 'react';
import { formatLabel } from '../../utils/format';

function FieldLabel({ htmlFor, required, children, hint }) {
    return (
        <div className="wb-admin-task-field-label-wrap">
            <label className="form-label wb-admin-task-field-label" htmlFor={htmlFor}>
                {children}
                {required ? (
                    <span className="wb-admin-task-required" aria-hidden>
                        *
                    </span>
                ) : null}
            </label>
            {hint ? <p className="wb-admin-task-field-hint">{hint}</p> : null}
        </div>
    );
}

function FormSection({ title, description, children }) {
    return (
        <section className="wb-admin-task-form-section">
            <header className="wb-admin-task-form-section-head">
                <h3 className="wb-admin-task-form-section-title">{title}</h3>
                {description ? <p className="wb-admin-task-form-section-desc">{description}</p> : null}
            </header>
            {children}
        </section>
    );
}

function DecisionPicker({ options, value, onChange, disabled }) {
    if (disabled) {
        return (
            <p className="wb-admin-task-form-note mb-0">
                Choose a <strong>task type</strong> above to see valid expected decisions for that schema.
            </p>
        );
    }

    return (
        <div className="wb-admin-task-decision-picker" role="radiogroup" aria-label="Expected decision">
            {options.map((option) => {
                const selected = value === option;
                return (
                    <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`wb-admin-task-decision-option ${selected ? 'is-selected' : ''}`}
                        onClick={() => onChange(option)}
                    >
                        {formatLabel(option)}
                    </button>
                );
            })}
        </div>
    );
}

function DifficultyPicker({ value, onChange }) {
    const level = Number(value) || 2;
    const labels = ['Intro', 'Easy', 'Medium', 'Hard', 'Expert'];

    return (
        <div className="wb-admin-task-diff-picker" role="group" aria-label="Difficulty level">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    className={`wb-admin-task-diff-option ${level === n ? 'is-selected' : ''}`}
                    onClick={() => onChange(n)}
                    aria-pressed={level === n}
                >
                    <span className="wb-admin-task-diff-option-num">{n}</span>
                    <span className="wb-admin-task-diff-option-text">{labels[n - 1]}</span>
                </button>
            ))}
        </div>
    );
}

export default function AdminTaskCreateForm({
    projectDetail,
    form,
    setForm,
    saving,
    onSubmit,
    onCancel,
}) {
    const selectedTaskType = useMemo(
        () => projectDetail?.task_types?.find((tt) => String(tt.id) === String(form.task_type_id)),
        [projectDetail, form.task_type_id],
    );

    const decisionOptions = useMemo(() => {
        const enumValues = selectedTaskType?.schema?.properties?.decision?.enum;
        return enumValues?.length ? enumValues : ['correct', 'incorrect'];
    }, [selectedTaskType]);

    const pickTaskType = (taskType) => {
        const enumValues = taskType.schema?.properties?.decision?.enum;
        const options = enumValues?.length ? enumValues : ['correct', 'incorrect'];
        setForm((prev) => ({
            ...prev,
            task_type_id: String(taskType.id),
            expected_decision: options.includes(prev.expected_decision)
                ? prev.expected_decision
                : options[0],
        }));
    };

    useEffect(() => {
        if (!form.task_type_id || !decisionOptions.length) return;
        if (!decisionOptions.includes(form.expected_decision)) {
            setForm((prev) => ({ ...prev, expected_decision: decisionOptions[0] }));
        }
    }, [form.task_type_id, form.expected_decision, decisionOptions, setForm]);

    const needsPairResponses = useMemo(() => {
        const slug = selectedTaskType?.slug ?? '';
        return slug.includes('pair') || slug.includes('binary') || slug.includes('combined');
    }, [selectedTaskType]);

    return (
        <form onSubmit={onSubmit} className="wb-admin-task-form">
            <header className="wb-admin-task-form-header">
                <div>
                    <p className="wb-admin-eyebrow mb-1">New evaluation task</p>
                    <h2 className="wb-admin-task-form-title">{projectDetail.name}</h2>
                    <p className="wb-admin-task-form-lead">
                        Version 1 will be created on rubric{' '}
                        <strong>v{projectDetail.current_version?.version_number ?? '—'}</strong> and marked active.
                    </p>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancel}>
                    Close
                </button>
            </header>

            <FormSection title="Basics" description="How the task appears in the bank and which schema applies.">
                <div className="row g-3">
                    <div className="col-12">
                        <FieldLabel htmlFor="task-title" required hint="Shown to learners in practice and assessments.">
                            Title
                        </FieldLabel>
                        <input
                            id="task-title"
                            className="form-control"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. Accurate science fact check"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="col-12">
                        <FieldLabel htmlFor="task-type" required>
                            Task type
                        </FieldLabel>
                        <div className="wb-admin-task-type-grid">
                            {projectDetail.task_types.map((tt) => {
                                const selected = String(form.task_type_id) === String(tt.id);
                                return (
                                    <button
                                        key={tt.id}
                                        type="button"
                                        className={`wb-admin-task-type-option ${selected ? 'is-selected' : ''}`}
                                        onClick={() => pickTaskType(tt)}
                                        aria-pressed={selected}
                                    >
                                        <span className="wb-admin-task-type-option-name">{tt.name}</span>
                                        <span className="wb-admin-task-type-option-slug">{tt.slug}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {!form.task_type_id ? (
                            <p className="wb-admin-task-form-note">Select a task type to unlock expected answer options.</p>
                        ) : null}
                    </div>
                    <div className="col-12">
                        <FieldLabel hint="Used for adaptive ordering and reporting—not shown to learners.">
                            Difficulty
                        </FieldLabel>
                        <DifficultyPicker
                            value={form.difficulty}
                            onChange={(n) => setForm({ ...form, difficulty: n })}
                        />
                    </div>
                </div>
            </FormSection>

            <FormSection title="Stimulus" description="What the learner reads before submitting a judgment.">
                <div className="row g-3">
                    <div className="col-12">
                        <FieldLabel htmlFor="task-prompt" required>
                            Prompt
                        </FieldLabel>
                        <textarea
                            id="task-prompt"
                            className="form-control wb-admin-task-textarea"
                            rows={4}
                            value={form.prompt}
                            onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                            placeholder="Question or instruction for the evaluator…"
                            required
                        />
                    </div>
                    <div className="col-12">
                        <FieldLabel htmlFor="task-context" hint="Optional background stored in task context JSON.">
                            Context notes
                        </FieldLabel>
                        <textarea
                            id="task-context"
                            className="form-control"
                            rows={2}
                            value={form.context_notes}
                            onChange={(e) => setForm({ ...form, context_notes: e.target.value })}
                            placeholder="Rubric hints, domain facts, or reviewer notes…"
                        />
                    </div>
                </div>
            </FormSection>

            <FormSection
                title="Response pair"
                description={
                    needsPairResponses
                        ? 'Both responses are typically required for comparison tasks.'
                        : 'Optional for this task type—leave blank if not used.'
                }
            >
                <div className="wb-admin-task-response-pair">
                    <div className="wb-admin-task-response-col">
                        <FieldLabel htmlFor="task-response-a">Response A</FieldLabel>
                        <textarea
                            id="task-response-a"
                            className="form-control wb-admin-task-textarea"
                            rows={5}
                            value={form.response_a}
                            onChange={(e) => setForm({ ...form, response_a: e.target.value })}
                            placeholder="First candidate answer…"
                        />
                    </div>
                    <div className="wb-admin-task-response-divider" aria-hidden>
                        vs
                    </div>
                    <div className="wb-admin-task-response-col">
                        <FieldLabel htmlFor="task-response-b">Response B</FieldLabel>
                        <textarea
                            id="task-response-b"
                            className="form-control wb-admin-task-textarea"
                            rows={5}
                            value={form.response_b}
                            onChange={(e) => setForm({ ...form, response_b: e.target.value })}
                            placeholder="Second candidate answer…"
                        />
                    </div>
                </div>
            </FormSection>

            <FormSection title="Expected answer" description="Ground truth used by the local evaluation engine.">
                <div className="row g-3">
                    <div className="col-12">
                        <FieldLabel required hint="Must match the task type schema—used as the gold label for auto-grading.">
                            Expected decision
                        </FieldLabel>
                        <DecisionPicker
                            options={decisionOptions}
                            value={form.expected_decision}
                            disabled={!form.task_type_id}
                            onChange={(option) => setForm({ ...form, expected_decision: option })}
                        />
                        <input
                            type="hidden"
                            name="expected_decision"
                            value={form.expected_decision}
                            required={Boolean(form.task_type_id)}
                        />
                    </div>
                    <div className="col-12">
                        <FieldLabel
                            htmlFor="task-explanation"
                            hint="Optional rationale stored with expected output for review."
                        >
                            Expected explanation
                        </FieldLabel>
                        <textarea
                            id="task-explanation"
                            className="form-control"
                            rows={2}
                            value={form.expected_explanation}
                            onChange={(e) => setForm({ ...form, expected_explanation: e.target.value })}
                            placeholder="Why this decision is correct…"
                        />
                    </div>
                </div>
            </FormSection>

            <footer className="wb-admin-task-form-footer">
                <p className="wb-admin-task-form-footer-note">
                    <span className="wb-admin-task-required" aria-hidden>
                        *
                    </span>{' '}
                    Required fields
                </p>
                <div className="wb-admin-task-form-actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={saving}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={saving || !form.task_type_id}>
                        {saving ? 'Creating…' : 'Create task'}
                    </button>
                </div>
            </footer>
        </form>
    );
}
