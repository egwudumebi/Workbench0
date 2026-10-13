import { useEffect, useState } from 'react';
import {
    acknowledgeAssessmentIntegrity,
    fetchAssessmentIntegrityRules,
    fetchAssessmentIntegrityStatus,
} from '../../api/academy';

export default function AssessmentIntegrityGate({ onReady }) {
    const [rules, setRules] = useState(null);
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const status = await fetchAssessmentIntegrityStatus();
                if (!active) return;
                if (status.acknowledged) {
                    onReady();
                    return;
                }
                setRules(await fetchAssessmentIntegrityRules());
            } catch (err) {
                if (active) setError(err.response?.data?.message ?? 'Could not load integrity rules.');
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleContinue = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await acknowledgeAssessmentIntegrity();
            onReady();
        } catch (err) {
            setError(err.response?.data?.message ?? 'Acknowledgement failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="wb-card p-4 text-muted">Loading assessment conditions…</div>;
    }

    if (!rules) {
        return error ? <div className="alert alert-danger">{error}</div> : null;
    }

    return (
        <div className="wb-card p-4">
            <h2 className="h5">{rules.title}</h2>
            <p className="text-muted">{rules.summary}</p>
            <ul>
                {(rules.rules ?? []).map((rule) => (
                    <li key={rule} className="mb-2">{rule}</li>
                ))}
            </ul>
            <label className="form-check mb-3">
                <input type="checkbox" className="form-check-input" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                <span className="form-check-label">I understand and will submit my own independent evaluations.</span>
            </label>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <button type="button" className="btn btn-primary" disabled={!checked || submitting} onClick={handleContinue}>
                {submitting ? 'Saving…' : 'Continue to assessment'}
            </button>
        </div>
    );
}
