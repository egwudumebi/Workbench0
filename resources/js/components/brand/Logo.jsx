import { Link } from 'react-router-dom';

const LOGO_MARK = '/logo-mark.png';
const MARK_ASPECT = 169 / 182;

const SIZES = {
    sm: { mark: 26, text: '0.9375rem' },
    md: { mark: 34, text: '1.125rem' },
    lg: { mark: 42, text: '1.375rem' },
};

/**
 * Logo mark replaces the "W" in Workbench0 → [mark]orkbench0
 *
 * @param {'dark' | 'light'} variant - text color on light or dark backgrounds
 * @param {'sm' | 'md' | 'lg'} size
 * @param {boolean} showText - show full wordmark; false = icon only
 * @param {string|null} to
 */
export default function Logo({
    variant = 'dark',
    size = 'md',
    showText = true,
    to = null,
    className = '',
}) {
    const s = SIZES[size] ?? SIZES.md;
    const textColor = variant === 'light' ? '#fff' : 'var(--wb-logo-dark, #0A1118)';

    const content = (
        <span
            className={`wb-logo d-inline-flex align-items-center ${className}`}
            style={{ textDecoration: 'none', lineHeight: 1 }}
            aria-label="Workbench0"
        >
            <img
                src={LOGO_MARK}
                alt=""
                width={s.mark}
                height={Math.round(s.mark * MARK_ASPECT)}
                className="wb-logo-mark flex-shrink-0"
                aria-hidden="true"
                draggable="false"
            />
            {showText && (
                <span
                    className="wb-logo-wordmark fw-bold d-inline-flex align-items-baseline"
                    style={{ fontSize: s.text, color: textColor, letterSpacing: '-0.03em' }}
                >
                    <span>orkbench</span>
                    <span className="wb-logo-zero">0</span>
                </span>
            )}
        </span>
    );

    if (to) {
        return (
            <Link to={to} className="text-decoration-none">
                {content}
            </Link>
        );
    }

    return content;
}

export function LogoMark({ size = 32, className = '' }) {
    return (
        <img
            src={LOGO_MARK}
            alt="Workbench0"
            width={size}
            height={Math.round(size * MARK_ASPECT)}
            className={`wb-logo-mark ${className}`}
            draggable="false"
        />
    );
}
