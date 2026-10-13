import { marked } from 'marked';

marked.setOptions({
    gfm: true,
    breaks: true,
});

export default function MarkdownContent({ content, className = '' }) {
    if (!content) return null;

    const html = marked.parse(content);

    return (
        <div
            className={`wb-markdown ${className}`.trim()}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
