import { formatLabel } from '../../utils/format';

function OptionPills({ options, value, onChange, ariaLabel }) {
    if (!options.length) {
        return <p className="wb-admin-task-form-note mb-0">Add options above first.</p>;
    }

    return (
        <div className="wb-admin-task-decision-picker" role="radiogroup" aria-label={ariaLabel}>
            {options.map((opt) => {
                const selected = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`wb-admin-task-decision-option ${selected ? 'is-selected' : ''}`}
                        onClick={() => onChange(opt.value)}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

function ListEditor({ label, hint, items, onChange, fields, emptyMessage }) {
    const addRow = () => {
        onChange([...items, fields.reduce((acc, f) => ({ ...acc, [f.key]: f.default ?? '' }), {})]);
    };

    const updateRow = (index, key, val) => {
        const next = [...items];
        next[index] = { ...next[index], [key]: val };
        onChange(next);
    };

    const removeRow = (index) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div className="wb-admin-arena-list-editor">
            <div className="wb-admin-arena-list-head">
                <div>
                    <span className="wb-admin-arena-list-label">{label}</span>
                    {hint ? <p className="wb-admin-task-field-hint mb-0">{hint}</p> : null}
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addRow}>
                    Add row
                </button>
            </div>
            {!items.length ? (
                <p className="wb-admin-arena-list-empty">{emptyMessage ?? 'No rows yet.'}</p>
            ) : (
                <ul className="wb-admin-arena-list-rows">
                    {items.map((item, index) => (
                        <li key={index} className="wb-admin-arena-list-row">
                            <div className="row g-2 flex-grow-1">
                                {fields.map((f) => (
                                    <div key={f.key} className={f.col ?? 'col-md-6'}>
                                        {f.multiline ? (
                                            <textarea
                                                className="form-control form-control-sm"
                                                rows={f.rows ?? 2}
                                                placeholder={f.placeholder}
                                                value={item[f.key] ?? ''}
                                                onChange={(e) => updateRow(index, f.key, e.target.value)}
                                            />
                                        ) : (
                                            <input
                                                className="form-control form-control-sm"
                                                placeholder={f.placeholder}
                                                value={item[f.key] ?? ''}
                                                onChange={(e) => updateRow(index, f.key, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-link text-danger wb-admin-arena-list-remove"
                                onClick={() => removeRow(index)}
                                aria-label={`Remove row ${index + 1}`}
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function PracticeArenaModeFields({ mode, form, setForm }) {
    const setModeFields = (patch) => setForm({ ...form, ...patch });

    if (mode === 'response_duel') {
        const duel = form.duel;
        return (
            <div className="wb-admin-arena-mode-fields">
                <label className="form-label">User prompt</label>
                <textarea
                    className="form-control wb-admin-task-textarea mb-3"
                    rows={2}
                    value={duel.prompt}
                    onChange={(e) => setModeFields({ duel: { ...duel, prompt: e.target.value } })}
                />
                <div className="wb-admin-task-response-pair mb-3">
                    <div className="wb-admin-task-response-col">
                        <label className="form-label">Response A</label>
                        <textarea
                            className="form-control wb-admin-task-textarea"
                            rows={5}
                            value={duel.response_a}
                            onChange={(e) => setModeFields({ duel: { ...duel, response_a: e.target.value } })}
                        />
                    </div>
                    <div className="wb-admin-task-response-divider" aria-hidden>
                        vs
                    </div>
                    <div className="wb-admin-task-response-col">
                        <label className="form-label">Response B</label>
                        <textarea
                            className="form-control wb-admin-task-textarea"
                            rows={5}
                            value={duel.response_b}
                            onChange={(e) => setModeFields({ duel: { ...duel, response_b: e.target.value } })}
                        />
                    </div>
                </div>
                <label className="form-label">Correct choice</label>
                <OptionPills
                    ariaLabel="Correct duel response"
                    value={duel.decision}
                    onChange={(decision) => setModeFields({ duel: { ...duel, decision } })}
                    options={[
                        { value: 'response_a', label: 'Response A' },
                        { value: 'response_b', label: 'Response B' },
                    ]}
                />
                <div className="row g-2 mt-3">
                    <div className="col-md-4">
                        <label className="form-label">Min explanation length</label>
                        <input
                            type="number"
                            min={0}
                            className="form-control"
                            value={duel.min_explanation_length}
                            onChange={(e) =>
                                setModeFields({ duel: { ...duel, min_explanation_length: e.target.value } })
                            }
                        />
                    </div>
                </div>
                <label className="form-label mt-3">Rationale (feedback)</label>
                <textarea
                    className="form-control"
                    rows={2}
                    value={duel.rationale}
                    onChange={(e) => setModeFields({ duel: { ...duel, rationale: e.target.value } })}
                />
            </div>
        );
    }

    if (mode === 'spot_the_error') {
        const spot = form.spot;
        const errorOptions = spot.errors
            .filter((e) => e.id)
            .map((e) => ({ value: e.id, label: e.label || e.id }));

        return (
            <div className="wb-admin-arena-mode-fields">
                <label className="form-label">AI response to evaluate</label>
                <textarea
                    className="form-control wb-admin-task-textarea mb-3"
                    rows={4}
                    value={spot.response}
                    onChange={(e) => setModeFields({ spot: { ...spot, response: e.target.value } })}
                />
                <ListEditor
                    label="Error options"
                    hint="Each row needs a stable id and learner-facing label."
                    items={spot.errors}
                    onChange={(errors) => setModeFields({ spot: { ...spot, errors } })}
                    emptyMessage="Add at least one error option for learners to pick."
                    fields={[
                        { key: 'id', placeholder: 'id (e.g. unsupported_stat)', col: 'col-md-4' },
                        { key: 'label', placeholder: 'Label shown to learner', col: 'col-md-8' },
                    ]}
                />
                <label className="form-label mt-3">Correct error</label>
                <OptionPills
                    ariaLabel="Correct error id"
                    value={spot.error_id}
                    onChange={(error_id) => setModeFields({ spot: { ...spot, error_id } })}
                    options={errorOptions}
                />
                <label className="form-label mt-3">Explanation (feedback)</label>
                <textarea
                    className="form-control"
                    rows={2}
                    value={spot.explanation}
                    onChange={(e) => setModeFields({ spot: { ...spot, explanation: e.target.value } })}
                />
            </div>
        );
    }

    if (mode === 'rule_match') {
        const rule = form.rule;
        return (
            <div className="wb-admin-arena-mode-fields">
                <ListEditor
                    label="Rules"
                    items={rule.rules}
                    onChange={(rules) => setModeFields({ rule: { ...rule, rules } })}
                    fields={[
                        { key: 'id', placeholder: 'Rule id', col: 'col-md-3' },
                        { key: 'text', placeholder: 'Rule text', col: 'col-md-9' },
                    ]}
                />
                <ListEditor
                    label="Examples"
                    items={rule.examples}
                    onChange={(examples) => setModeFields({ rule: { ...rule, examples } })}
                    fields={[
                        { key: 'id', placeholder: 'Example id', col: 'col-md-3' },
                        { key: 'text', placeholder: 'Example text', col: 'col-md-9', multiline: true, rows: 2 },
                    ]}
                />
                <ListEditor
                    label="Correct pairs"
                    hint="Match each example id to a rule id."
                    items={rule.pairs}
                    onChange={(pairs) => setModeFields({ rule: { ...rule, pairs } })}
                    fields={[
                        { key: 'example_id', placeholder: 'Example id', col: 'col-md-6' },
                        { key: 'rule_id', placeholder: 'Rule id', col: 'col-md-6' },
                    ]}
                />
            </div>
        );
    }

    if (mode === 'scenario') {
        const sc = form.scenario;
        const choiceOptions = sc.choices
            .filter((c) => c.id)
            .map((c) => ({ value: c.id, label: c.label || formatLabel(c.id) }));

        return (
            <div className="wb-admin-arena-mode-fields">
                <label className="form-label">Scenario text</label>
                <textarea
                    className="form-control wb-admin-task-textarea mb-3"
                    rows={3}
                    value={sc.scenario}
                    onChange={(e) => setModeFields({ scenario: { ...sc, scenario: e.target.value } })}
                />
                <ListEditor
                    label="Choices"
                    items={sc.choices}
                    onChange={(choices) => setModeFields({ scenario: { ...sc, choices } })}
                    fields={[
                        { key: 'id', placeholder: 'Choice id', col: 'col-md-4' },
                        { key: 'label', placeholder: 'Label', col: 'col-md-8' },
                    ]}
                />
                <label className="form-label mt-3">Best choice</label>
                <OptionPills
                    ariaLabel="Best scenario choice"
                    value={sc.best_choice}
                    onChange={(best_choice) => setModeFields({ scenario: { ...sc, best_choice } })}
                    options={choiceOptions}
                />
                <div className="row g-2 mt-3">
                    <div className="col-md-6">
                        <label className="form-label">Feedback if best (flag_uncertainty)</label>
                        <textarea
                            className="form-control"
                            rows={2}
                            value={sc.feedback_flag}
                            onChange={(e) => setModeFields({ scenario: { ...sc, feedback_flag: e.target.value } })}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Feedback if wrong (approve_excellent)</label>
                        <textarea
                            className="form-control"
                            rows={2}
                            value={sc.feedback_approve}
                            onChange={(e) => setModeFields({ scenario: { ...sc, feedback_approve: e.target.value } })}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'boss') {
        const boss = form.boss;
        return (
            <div className="wb-admin-arena-mode-fields">
                <label className="form-label">Intro</label>
                <input
                    className="form-control mb-3"
                    value={boss.intro}
                    onChange={(e) => setModeFields({ boss: { ...boss, intro: e.target.value } })}
                />
                <ListEditor
                    label="Stages"
                    hint="Each stage is a prompt plus expected short answer."
                    items={boss.stages}
                    onChange={(stages) => setModeFields({ boss: { ...boss, stages } })}
                    fields={[
                        { key: 'prompt', placeholder: 'Stage prompt', col: 'col-md-8', multiline: true, rows: 2 },
                        { key: 'answer', placeholder: 'Expected answer', col: 'col-md-4' },
                    ]}
                />
            </div>
        );
    }

    return null;
}
