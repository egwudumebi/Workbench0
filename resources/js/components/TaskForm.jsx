import { formatLabel } from '../utils/format';
import { getDecisionOptions, getFormConfig } from '../utils/taskTypeDisplay';

function optionClass(option) {
    if (option === 'response_a' || option === 'correct') return 'opt-a';
    if (option === 'response_b' || option === 'incorrect') return 'opt-b';
    if (option === 'both_equal' || option === 'tie') return 'opt-tie';
    return '';
}

export default function TaskForm({
    task,
    decision,
    explanation,
    onDecisionChange,
    onExplanationChange,
    disabled,
    variant = 'default',
}) {
    const form = getFormConfig(task);
    const options = getDecisionOptions(task);
    const explanationRequired = form.required.includes(form.explanationField);
    const isStudio = variant === 'studio';

    return (
        <form className={isStudio ? 'wb-eval-form' : ''} onSubmit={(e) => e.preventDefault()}>
            <div className="mb-3">
                <label className={isStudio ? 'wb-eval-label' : 'form-label fw-semibold'}>
                    {form.decisionLabel}
                </label>
                {form.decisionStyle === 'select' ? (
                    <select
                        className={isStudio ? 'form-select wb-eval-input' : 'form-select'}
                        value={decision}
                        onChange={(e) => onDecisionChange(e.target.value)}
                        disabled={disabled}
                    >
                        <option value="">Select…</option>
                        {options.map((option) => (
                            <option key={option} value={option}>
                                {formatLabel(option)}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div className={isStudio ? 'wb-eval-choice-grid' : 'd-flex flex-wrap gap-2'}>
                        {options.map((option) => (
                            isStudio ? (
                                <label
                                    key={option}
                                    className={`wb-eval-choice ${optionClass(option)} ${decision === option ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        className="visually-hidden"
                                        name="decision"
                                        value={option}
                                        checked={decision === option}
                                        onChange={(e) => onDecisionChange(e.target.value)}
                                        disabled={disabled}
                                    />
                                    <span className="wb-eval-choice-title">{formatLabel(option)}</span>
                                </label>
                            ) : (
                                <div className="form-check" key={option}>
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="decision"
                                        id={`decision-${option}`}
                                        value={option}
                                        checked={decision === option}
                                        onChange={(e) => onDecisionChange(e.target.value)}
                                        disabled={disabled}
                                    />
                                    <label className="form-check-label" htmlFor={`decision-${option}`}>
                                        {formatLabel(option)}
                                    </label>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>

            {form.explanationProperty && (
                <div className="mb-3">
                    <label htmlFor="explanation" className={isStudio ? 'wb-eval-label' : 'form-label fw-semibold'}>
                        {form.explanationProperty.title ?? 'Explanation'}
                        {explanationRequired && <span className="text-danger"> *</span>}
                    </label>
                    <textarea
                        id="explanation"
                        className={isStudio ? 'form-control wb-eval-input wb-eval-textarea' : 'form-control'}
                        rows={4}
                        value={explanation}
                        onChange={(e) => onExplanationChange(e.target.value)}
                        placeholder={form.explanationProperty.description ?? 'Explain your decision with specific references to the response.'}
                        disabled={disabled}
                    />
                    {form.explanationProperty.minLength && (
                        <div className="form-text">
                            Minimum {form.explanationProperty.minLength} characters recommended.
                        </div>
                    )}
                </div>
            )}
        </form>
    );
}
