import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAcademyCurriculum } from '../../api/academy';
import LearningMap from '../../components/academy/LearningMap';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';

export default function PublishedAcademyStudy() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                setData(await fetchAcademyCurriculum(id));
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorAlert error={error} />;
    if (!data) return null;

    const structure = data.curriculum?.structure ?? {};
    const modules = (structure.modules ?? []).map((mod) => ({
        ...mod,
        lessons: (structure.lessons ?? []).filter((l) => l.module_slug === mod.slug),
    }));

    return (
        <div>
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/my-paths">My Learning Paths</Link></li>
                    <li className="breadcrumb-item active">{data.academy.title}</li>
                </ol>
            </nav>

            <div className="wb-card p-4 mb-4">
                <h1 className="h3">{data.academy.title}</h1>
                <p className="text-muted">{data.academy.description}</p>
                <p className="small text-muted mb-0">
                    Curriculum version {data.curriculum.version_number} · Published snapshot (immutable)
                </p>
            </div>

            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="wb-card p-4">
                        <h2 className="h5 mb-3">Learning map</h2>
                        <LearningMap modules={modules} lessonProgress={{}} />
                    </div>
                </div>
                <div className="col-lg-5">
                    <div className="wb-card p-4">
                        <h2 className="h6">Source references</h2>
                        <ul className="small mb-0">
                            {(data.source_rules ?? []).slice(0, 8).map((rule) => (
                                <li key={rule.id} className="mb-2">
                                    {rule.rule_text}
                                    {rule.section_ref && <span className="text-muted"> ({rule.section_ref})</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {(structure.ambiguities ?? data.curriculum.ambiguities ?? []).length > 0 && (
                        <div className="wb-card p-4 mt-3 border-warning">
                            <h2 className="h6">Flagged ambiguities</h2>
                            <ul className="small mb-0">
                                {(structure.ambiguities ?? data.curriculum.ambiguities).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
