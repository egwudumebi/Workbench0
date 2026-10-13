import { useAdminConfirm } from '../../hooks/useAdminConfirm';
import { defaultModeFields } from '../../utils/practiceArenaAdminForm';
import { difficultyTier, modeMeta } from '../../utils/practiceArenaModes';
import PracticeArenaModeFields from './PracticeArenaModeFields';

const MODES = ['response_duel', 'spot_the_error', 'rule_match', 'scenario', 'boss'];

function DifficultyPicker({ value, onChange }) {
    const level = Number(value) || 2;
    const labels = ['Intro', 'Easy', 'Medium', 'Hard', 'Epic'];

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

export default function AdminArenaChallengeForm({
    form,
    setForm,
    programs,
    saving,
    editing,
    onSubmit,
    onCancel,
}) {
    const { confirm, dialog } = useAdminConfirm();
    const meta = modeMeta(form.mode);
    const tier = difficultyTier(form.difficulty);

    const pickMode = async (mode) => {
        if (mode === form.mode) return;
        if (editing) {
            const ok = await confirm({
                title: 'Change quest mode?',
                message:
                    'Changing mode replaces mode-specific content with that mode’s template. You can still cancel without saving.',
                confirmLabel: 'Change mode',
            });
            if (!ok) return;
        }
        setForm({
            ...form,
            mode,
            ...defaultModeFields(mode),
        });
    };

    return (
        <>
        <form onSubmit={onSubmit} className="wb-admin-task-form wb-admin-arena-form">
            <header className="wb-admin-task-form-header">
                <div>
                    <p className="wb-admin-eyebrow mb-1">{editing ? 'Edit challenge' : 'New arena challenge'}</p>
                    <h2 className="wb-admin-task-form-title">
                        {editing ? form.title || 'Untitled challenge' : 'Create Practice Arena quest'}
                    </h2>
                    {editing ? (
                        <p className="wb-admin-arena-form-meta">
                            ID {form.id}
                            {form.slug ? (
                                <>
                                    {' '}
                                    · <code>{form.slug}</code>
                                </>
                            ) : null}
                            {' '}
                            · {meta.icon} {meta.short}
                        </p>
                    ) : (
                        <p className="wb-admin-task-form-lead">
                            Structured fields for each quest mode—no JSON editing required.
                        </p>
                    )}
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancel}>
                    Close
                </button>
            </header>

            <div className="wb-admin-arena-form-layout">
                <div className="wb-admin-arena-form-main">
                    <section className="wb-admin-task-form-section">
                        <header className="wb-admin-task-form-section-head">
                            <h3 className="wb-admin-task-form-section-title">Basics</h3>
                            <p className="wb-admin-task-form-section-desc">Title, visibility, and programme scope.</p>
                        </header>
                        <div className="row g-3">
                            <div className="col-md-8">
                                <label className="form-label wb-admin-task-field-label">
                                    Title <span className="wb-admin-task-required">*</span>
                                </label>
                                <input
                                    className="form-control"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                    autoFocus={!editing}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Slug {editing ? '' : '(optional)'}</label>
                                <input
                                    className="form-control"
                                    value={form.slug}
                                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                    placeholder={editing ? form.slug : 'auto-generated'}
                                    readOnly={editing}
                                    disabled={editing}
                                    title={editing ? 'Slug is fixed after create' : undefined}
                                />
                            </div>
                            <div className="col-md-8">
                                <label className="form-label">Programme (optional)</label>
                                <select
                                    className="form-select"
                                    value={form.training_program_id}
                                    onChange={(e) => setForm({ ...form, training_program_id: e.target.value })}
                                >
                                    <option value="">Global / any programme</option>
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Difficulty · {tier.label}</label>
                                <DifficultyPicker
                                    value={form.difficulty}
                                    onChange={(n) => setForm({ ...form, difficulty: n })}
                                />
                            </div>
                            <div className="col-12">
                                <label className="form-label">Learner instructions</label>
                                <textarea
                                    className="form-control"
                                    rows={2}
                                    value={form.instructions}
                                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                                    placeholder="Short briefing shown before the quest starts…"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="wb-admin-task-form-section">
                        <header className="wb-admin-task-form-section-head">
                            <h3 className="wb-admin-task-form-section-title">Mode content</h3>
                            <p className="wb-admin-task-form-section-desc">{meta.blurb}</p>
                        </header>
                        <PracticeArenaModeFields mode={form.mode} form={form} setForm={setForm} />
                    </section>

                    <section className="wb-admin-task-form-section">
                        <header className="wb-admin-task-form-section-head">
                            <h3 className="wb-admin-task-form-section-title">Skills & publishing</h3>
                        </header>
                        <div className="row g-3">
                            <div className="col-12">
                                <label className="form-label">Skill slugs</label>
                                <input
                                    className="form-control"
                                    value={form.skill_slugs}
                                    onChange={(e) => setForm({ ...form, skill_slugs: e.target.value })}
                                    placeholder="factual-accuracy, rubric-reading"
                                />
                                <p className="wb-admin-task-field-hint mb-0">Comma-separated; used for XP and progress mapping.</p>
                            </div>
                            <div className="col-12">
                                <div className="wb-admin-arena-publish-toggles">
                                    <label className={`wb-admin-arena-toggle ${form.active ? 'is-on' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={form.active}
                                            onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                        />
                                        <span className="wb-admin-arena-toggle-copy">
                                            <strong>Live in arena</strong>
                                            <span>Learners can discover and play this quest</span>
                                        </span>
                                    </label>
                                    <label className={`wb-admin-arena-toggle ${form.is_daily ? 'is-on' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={form.is_daily}
                                            onChange={(e) => setForm({ ...form, is_daily: e.target.checked })}
                                        />
                                        <span className="wb-admin-arena-toggle-copy">
                                            <strong>Today&apos;s daily</strong>
                                            <span>Replaces any other daily challenge</span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <aside className="wb-admin-arena-form-aside">
                    <div className="wb-admin-arena-aside-panel">
                        <h3 className="wb-admin-arena-aside-title">Quest mode</h3>
                        {editing ? (
                            <p className="wb-admin-arena-aside-note">
                                Changing mode resets content below. Pick carefully when editing live quests.
                            </p>
                        ) : null}
                        <div className="wb-admin-arena-mode-picker wb-admin-arena-mode-picker--stacked">
                            {MODES.map((m) => {
                                const mmeta = modeMeta(m);
                                const selected = form.mode === m;
                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        className={`wb-admin-arena-mode-option ${selected ? 'is-selected' : ''}`}
                                        onClick={() => pickMode(m)}
                                        aria-pressed={selected}
                                    >
                                        <span className="wb-admin-arena-mode-option-icon" aria-hidden>
                                            {mmeta.icon}
                                        </span>
                                        <span className="wb-admin-arena-mode-option-name">{mmeta.short}</span>
                                        <span className="wb-admin-arena-mode-option-blurb">{mmeta.blurb}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>

            <footer className="wb-admin-task-form-footer">
                <p className="wb-admin-task-form-footer-note mb-0">
                    {editing ? 'Changes apply immediately for learners on next arena load.' : 'Challenge starts active unless you turn off Live in arena.'}
                </p>
                <div className="wb-admin-task-form-actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={saving}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                        {saving ? 'Saving…' : editing ? 'Save changes' : 'Create challenge'}
                    </button>
                </div>
            </footer>
        </form>
        {dialog}
        </>
    );
}
