export default function TaskMedia({ images }) {
    if (!images?.length) return null;

    return (
        <div className="mb-4">
            <div className="task-panel-label">
                Reference {images.length === 1 ? 'Image' : 'Images'}
            </div>
            <div className={`task-media-grid task-media-grid-${Math.min(images.length, 2)}`}>
                {images.map((image, index) => (
                    <figure key={`${image.url}-${index}`} className="task-media-item">
                        <a
                            href={image.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="task-media-link"
                        >
                            <img
                                src={image.url}
                                alt={image.alt}
                                loading="lazy"
                                decoding="async"
                                className="task-media-image"
                            />
                        </a>
                        {image.caption && (
                            <figcaption className="task-media-caption">{image.caption}</figcaption>
                        )}
                    </figure>
                ))}
            </div>
        </div>
    );
}
