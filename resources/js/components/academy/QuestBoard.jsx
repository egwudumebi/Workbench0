import { Link } from 'react-router-dom';

export default function QuestBoard({ continueLesson, dailyChallenge, enrolments = [] }) {
    const activeEnrol = enrolments.find((e) => e.status === 'active') ?? enrolments[0];

    return (
        <div className="wb-quest-board">
            <div className="wb-quest-board-header">
                <span className="wb-quest-board-label">Active quests</span>
                {activeEnrol && (
                    <span className="wb-quest-board-meta">
                        {Math.round(activeEnrol.progress_percent ?? 0)}% path complete
                    </span>
                )}
            </div>

            <div className="row g-3">
                <div className="col-md-6">
                    <Link
                        to={continueLesson ? `/academy-lessons/${continueLesson.id}` : '/explore'}
                        className="wb-quest-card wb-quest-card-main text-decoration-none"
                    >
                        <div className="wb-quest-type">Main quest</div>
                        <div className="wb-quest-title">
                            {continueLesson?.title ?? 'Choose a training programme'}
                        </div>
                        <div className="wb-quest-cta">Resume →</div>
                    </Link>
                </div>
                <div className="col-md-6">
                    <Link
                        to={dailyChallenge ? `/practice-arena` : '/practice-arena'}
                        className="wb-quest-card wb-quest-card-daily text-decoration-none"
                    >
                        <div className="wb-quest-type">Daily challenge</div>
                        <div className="wb-quest-title">
                            {dailyChallenge?.title ?? 'Practice Arena'}
                        </div>
                        <div className="wb-quest-cta">Play now ⚔</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
