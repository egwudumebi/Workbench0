export function extractTaskImages(task) {
    if (!task) return [];

    if (Array.isArray(task.images) && task.images.length) {
        return normalizeImages(task.images);
    }

    const sources = [task.context, task.configuration].filter(Boolean);

    for (const source of sources) {
        for (const key of ['images', 'attachments', 'media']) {
            if (Array.isArray(source[key]) && source[key].length) {
                return normalizeImages(source[key]);
            }
        }
    }

    return [];
}

function normalizeImages(items) {
    return items
        .map((item, index) => {
            if (typeof item === 'string') {
                return { url: item, alt: `Reference image ${index + 1}`, caption: null };
            }

            if (!item?.url) return null;

            return {
                url: item.url,
                alt: item.alt ?? item.title ?? `Reference image ${index + 1}`,
                caption: item.caption ?? item.description ?? null,
            };
        })
        .filter(Boolean);
}
