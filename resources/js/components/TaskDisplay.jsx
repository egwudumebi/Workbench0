import TaskMedia from './TaskMedia';
import { formatLabel } from '../utils/format';
import { extractTaskImages } from '../utils/taskMedia';
import {
    getContextText,
    getTaskTypeDisplay,
    panelLabel,
    PANEL_KEYS,
    shouldShowPanel,
} from '../utils/taskTypeDisplay';

function ResponseDuelCards({ task, display }) {
    const labelA = panelLabel('response_a', task, display);
    const labelB = panelLabel('response_b', task, display);

    return (
        <div className="wb-eval-duel-grid">
            <article className="wb-eval-response wb-eval-response-a">
                <header className="wb-eval-response-head">
                    <span className="wb-eval-model-badge a">Model A</span>
                    <span className="wb-eval-response-label">{labelA.replace(/^AI Response A$/i, 'Response')}</span>
                </header>
                <div className="wb-eval-response-body">{task.response_a}</div>
            </article>
            <article className="wb-eval-response wb-eval-response-b">
                <header className="wb-eval-response-head">
                    <span className="wb-eval-model-badge b">Model B</span>
                    <span className="wb-eval-response-label">{labelB.replace(/^AI Response B$/i, 'Response')}</span>
                </header>
                <div className="wb-eval-response-body">{task.response_b}</div>
            </article>
        </div>
    );
}

export default function TaskDisplay({ task, variant = 'default' }) {
    if (!task) return null;

    const display = getTaskTypeDisplay(task);
    const images = extractTaskImages(task);
    const contextText = getContextText(task.context);
    const isStudio = variant === 'studio';
    const hasDuel = Boolean(task.response_a?.trim() && task.response_b?.trim());

    const showPrompt = task.prompt && shouldShowPanel('prompt', task, display);
    const showContext = contextText && shouldShowPanel('context', task, display);

    const rootClass = isStudio ? 'wb-eval-task' : '';

    if (isStudio && hasDuel) {
        return (
            <div className={rootClass}>
                <header className="wb-eval-task-head">
                    <p className="wb-eval-task-eyebrow">Evaluation practice</p>
                    <h2 className="wb-eval-task-title">
                        {task.title || 'AI Response Evaluation Task'}
                    </h2>
                    <p className="wb-eval-task-sub">
                        Compare both responses using rubric criteria, then record your verdict and justification.
                    </p>
                    <div className="wb-eval-task-badges">
                        <span className="wb-eval-task-badge type">{task.task_type?.name ?? 'Task'}</span>
                        <span className="wb-eval-task-badge diff">
                            {task.difficulty_label ?? formatLabel(task.difficulty)}
                        </span>
                    </div>
                </header>

                {(showContext || display.instructions) && (
                    <section className="wb-eval-block">
                        <h3 className="wb-eval-block-title">Task instructions</h3>
                        <p className="wb-eval-block-text">
                            {contextText || 'Rate the responses on accuracy, instruction following, and explanation quality.'}
                        </p>
                    </section>
                )}

                {showPrompt && (
                    <section className="wb-eval-prompt">
                        <span className="wb-eval-prompt-label">Original prompt</span>
                        <p className="wb-eval-prompt-text">{task.prompt}</p>
                    </section>
                )}

                {shouldShowPanel('images', task, display) && images.length > 0 && (
                    <div className="wb-eval-media">
                        <TaskMedia images={images} />
                    </div>
                )}

                <ResponseDuelCards task={task} display={display} />
            </div>
        );
    }

    const panels = {
        context: showContext && (
            <div className="mb-4" key="context">
                <div className="task-panel-label">{panelLabel('context', task, display)}</div>
                <div className={isStudio ? 'wb-eval-panel-fallback' : 'task-panel'}>{contextText}</div>
            </div>
        ),
        images: shouldShowPanel('images', task, display) && images.length > 0 && (
            <TaskMedia images={images} key="images" />
        ),
        prompt: showPrompt && (
            <div className="mb-4" key="prompt">
                <div className="task-panel-label">{panelLabel('prompt', task, display)}</div>
                <div className={isStudio ? 'wb-eval-prompt wb-eval-prompt-inline' : 'task-panel'}>
                    {isStudio ? (
                        <>
                            <span className="wb-eval-prompt-label">Original prompt</span>
                            <p className="wb-eval-prompt-text mb-0">{task.prompt}</p>
                        </>
                    ) : (
                        task.prompt
                    )}
                </div>
            </div>
        ),
        response_a: task.response_a && shouldShowPanel('response_a', task, display) && !hasDuel && (
            <div className="mb-4" key="response_a">
                <div className="task-panel-label">{panelLabel('response_a', task, display)}</div>
                <div className={isStudio ? 'wb-eval-panel-fallback' : 'task-panel'}>{task.response_a}</div>
            </div>
        ),
        response_b: task.response_b && shouldShowPanel('response_b', task, display) && !hasDuel && (
            <div className="mb-4" key="response_b">
                <div className="task-panel-label">{panelLabel('response_b', task, display)}</div>
                <div className={isStudio ? 'wb-eval-panel-fallback' : 'task-panel'}>{task.response_b}</div>
            </div>
        ),
    };

    const orderedPanels = PANEL_KEYS.map((key) => panels[key]).filter(Boolean);

    return (
        <div className={rootClass}>
            <div className={`d-flex flex-wrap gap-2 align-items-center ${isStudio ? 'wb-eval-task-badges mb-3' : 'mb-4'}`}>
                <span className={isStudio ? 'wb-eval-task-badge type' : 'badge rounded-pill'} style={isStudio ? undefined : { background: 'var(--wb-accent-soft)', color: 'var(--wb-accent)' }}>
                    {task.task_type?.name ?? 'Task'}
                </span>
                <span className={isStudio ? 'wb-eval-task-badge diff' : 'badge rounded-pill bg-light text-dark border'}>
                    {task.difficulty_label ?? formatLabel(task.difficulty)}
                </span>
            </div>

            {task.title && !hasDuel && (
                <h2 className={isStudio ? 'wb-eval-task-title mb-4' : 'h5 fw-semibold mb-4'}>{task.title}</h2>
            )}

            {hasDuel && !isStudio && <ResponseDuelCards task={task} display={display} />}

            {orderedPanels.length > 0 ? orderedPanels : (
                <>
                    {images.length > 0 && <TaskMedia images={images} />}
                    {task.prompt && (
                        <div className="mb-4">
                            <div className="task-panel-label">Prompt</div>
                            <div className="task-panel">{task.prompt}</div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
