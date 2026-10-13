import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    createMyAcademy,
    fetchMyAcademies,
    fetchMyAcademy,
    generateAcademyCurriculum,
    publishMyAcademy,
    uploadGuidelineDocument,
} from '../../api/academy';
import GamePageHero from '../../components/academy/GamePageHero';
import ErrorAlert from '../../components/ui/ErrorAlert';

const SAMPLE_PATH = '/samples/sample_evaluator_guidelines.txt';

const STEPS = [
    { num: 1, label: 'Forge' },
    { num: 2, label: 'Upload' },
    { num: 3, label: 'Analyze' },
    { num: 4, label: 'Publish' },
];

export default function BuildMyAcademy() {
    const [academies, setAcademies] = useState([]);
    const [active, setActive] = useState(null);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        title: '',
        description: '',
        target_platform: '',
        experience_level: 'beginner',
        learning_goals: '',
        authorized_upload: false,
    });
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const refresh = async () => setAcademies(await fetchMyAcademies());

    useEffect(() => {
        refresh().catch((err) => setError(err));
    }, []);

    const createAcademy = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const academy = await createMyAcademy({
                ...form,
                learning_goals: form.learning_goals ? form.learning_goals.split('\n').filter(Boolean) : [],
                authorized_upload: form.authorized_upload ? 1 : 0,
            });
            setActive(academy);
            setStep(2);
            await refresh();
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    };

    const upload = async (e) => {
        e.preventDefault();
        if (!active || !file) return;
        setBusy(true);
        try {
            const data = new FormData();
            data.append('document', file);
            data.append('authorized_upload', '1');
            await uploadGuidelineDocument(active.id, data);
            setActive(await fetchMyAcademy(active.id));
            setStep(3);
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    };

    const generate = async () => {
        if (!active) return;
        setBusy(true);
        try {
            const updated = await generateAcademyCurriculum(active.id);
            setActive(updated);
            setStep(4);
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    };

    const publish = async () => {
        if (!active) return;
        setBusy(true);
        try {
            setActive(await publishMyAcademy(active.id));
            await refresh();
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    };

    const loadAcademy = async (id) => {
        setActive(await fetchMyAcademy(id));
        setStep(4);
    };

    return (
        <div className="wb-gamehub-page">
            <GamePageHero
                eyebrow="Creator mode"
                title="Build My Academy"
                subtitle="Upload guidelines you are authorised to use. Workbench0 analyses them locally — no external AI required."
                stats={[
                    { value: academies.length, label: 'Projects' },
                    { value: `Step ${step}`, label: 'Quest stage', variant: 'gold' },
                    { value: active?.status ?? '—', label: 'Active status' },
                ]}
            />

            <div className="wb-gamehub-alert">
                Uploading does not grant permission to redistribute documents or send them to third-party AI.
                Use the <a href={SAMPLE_PATH} download>sample fictional guideline</a> for partner demos.
            </div>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <div className="wb-gamehub-quest-track mb-4">
                {STEPS.map((s) => (
                    <div
                        key={s.num}
                        className={`wb-gamehub-quest-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}
                    >
                        <span className="wb-gamehub-quest-step-num">{s.num}</span>
                        <span className="wb-gamehub-quest-step-label">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="wb-gamehub-panel">
                        <h2 className="wb-gamehub-panel-title">Your academies</h2>
                        {academies.length === 0 ? (
                            <p className="small text-muted mb-0">No academies yet — start the forge on the right.</p>
                        ) : (
                            <ul className="wb-gamehub-academy-list">
                                {academies.map((a) => (
                                    <li key={a.id}>
                                        <button type="button" className="wb-gamehub-academy-link" onClick={() => loadAcademy(a.id)}>
                                            {a.title}
                                        </button>
                                        <span className={`wb-gamehub-status-pill ${a.status}`}>{a.status}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="col-lg-8">
                    {step === 1 && (
                        <form onSubmit={createAcademy} className="wb-gamehub-panel wb-gamehub-console">
                            <h2 className="wb-gamehub-panel-title">Step 1 — Forge your academy</h2>
                            <input
                                className="form-control wb-gamehub-input mb-2"
                                placeholder="Academy title"
                                required
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                            <textarea
                                className="form-control wb-gamehub-input mb-2"
                                placeholder="Description"
                                rows={2}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                            <input
                                className="form-control wb-gamehub-input mb-2"
                                placeholder="Target platform (optional)"
                                value={form.target_platform}
                                onChange={(e) => setForm({ ...form, target_platform: e.target.value })}
                            />
                            <textarea
                                className="form-control wb-gamehub-input mb-2"
                                placeholder="Learning goals (one per line)"
                                rows={3}
                                value={form.learning_goals}
                                onChange={(e) => setForm({ ...form, learning_goals: e.target.value })}
                            />
                            <label className="wb-gamehub-toggle mb-3">
                                <input
                                    type="checkbox"
                                    checked={form.authorized_upload}
                                    onChange={(e) => setForm({ ...form, authorized_upload: e.target.checked })}
                                />
                                <span className="wb-gamehub-toggle-ui" />
                                <span>I am authorised to upload and process this material in Workbench0.</span>
                            </label>
                            <button type="submit" className="btn wb-gamehub-btn-primary" disabled={busy || !form.authorized_upload}>
                                Continue quest
                            </button>
                        </form>
                    )}

                    {step >= 2 && active && (
                        <form onSubmit={upload} className="wb-gamehub-panel wb-gamehub-console mb-3">
                            <h2 className="wb-gamehub-panel-title">Step 2 — Upload guidelines</h2>
                            <p className="wb-gamehub-panel-sub">PDF, DOCX, or TXT</p>
                            <input
                                type="file"
                                className="form-control wb-gamehub-input mb-3"
                                accept=".pdf,.docx,.txt"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                required
                            />
                            <button type="submit" className="btn wb-gamehub-btn-primary" disabled={busy || !file}>
                                Upload scroll
                            </button>
                        </form>
                    )}

                    {step >= 3 && active && (
                        <div className="wb-gamehub-panel wb-gamehub-console mb-3">
                            <h2 className="wb-gamehub-panel-title">Step 3 — Analyze & generate</h2>
                            {active.documents?.[0]?.ocr_required && (
                                <div className="wb-gamehub-alert warn">This file may require OCR before generation.</div>
                            )}
                            <button type="button" className="btn wb-gamehub-btn-primary" onClick={generate} disabled={busy}>
                                Generate curriculum (local provider)
                            </button>
                        </div>
                    )}

                    {step >= 4 && active?.curriculum_versions?.length > 0 && (
                        <div className="wb-gamehub-panel wb-gamehub-console">
                            <h2 className="wb-gamehub-panel-title">Step 4 — Review & publish</h2>
                            <p className="wb-gamehub-panel-sub">
                                Version {active.curriculum_versions[0].version_number} — immutable once published.
                            </p>
                            <pre className="wb-gamehub-code-preview">
                                {JSON.stringify(active.curriculum_versions[0].structure?.modules ?? [], null, 2)}
                            </pre>
                            {active.documents?.[0]?.rules?.length > 0 && (
                                <div className="mt-3">
                                    <h3 className="h6 fw-bold">Extracted rules (traceable)</h3>
                                    <ul className="small mb-3">
                                        {active.documents[0].rules.slice(0, 5).map((r) => (
                                            <li key={r.id}>
                                                {r.rule_text} <em className="text-muted">({r.section_ref})</em>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="d-flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="btn wb-gamehub-btn-success"
                                    onClick={publish}
                                    disabled={busy || active.status === 'published'}
                                >
                                    Publish to My Learning Paths
                                </button>
                                {active.status === 'published' && (
                                    <Link to="/my-paths" className="btn wb-gamehub-btn-outline">
                                        View learning paths
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
