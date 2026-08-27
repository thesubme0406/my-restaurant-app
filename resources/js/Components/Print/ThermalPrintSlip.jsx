import './thermalSlip.css';

const DEFAULT_LOGO = '/images/oshinei-logo.png';

/**
 * Reusable 80mm thermal slip shell (matches payment receipt layout).
 *
 * @param {{
 *   logoSrc?: string;
 *   brandName?: string;
 *   title: string;
 *   heroLabel?: string;
 *   hero: string;
 *   rows?: Array<{ label: string; value: string }>;
 *   footer: string;
 *   printedAt?: string;
 *   heroClassName?: string;
 * }} props
 */
export default function ThermalPrintSlip({
    logoSrc = DEFAULT_LOGO,
    brandName = 'OSHINEI',
    title,
    heroLabel,
    hero,
    heroClassName,
    rows = [],
    footer,
    printedAt,
}) {
    return (
        <article className="thermal-slip" lang="lo" aria-label={title}>
            <div className="thermal-slip__logo-wrap">
                <img className="thermal-slip__logo" src={logoSrc} alt="" width={72} height={72} />
            </div>
            <p className="thermal-slip__brand">{brandName}</p>
            <p className="thermal-slip__title">{title}</p>
            <p className="thermal-slip__dash-text" aria-hidden>
                - - - - - - - - - - - - - - - -
            </p>

            <div className="thermal-slip__hero-wrap">
                {heroLabel ? <p className="thermal-slip__hero-label">{heroLabel}</p> : null}
                <p className={`thermal-slip__hero${heroClassName ? ` ${heroClassName}` : ''}`}>{hero}</p>
            </div>

            <p className="thermal-slip__dash-text" aria-hidden>
                - - - - - - - - - - - - - - - -
            </p>

            {rows.length > 0 ? (
                <div className="thermal-slip__meta">
                    {rows.map((row) => (
                        <div key={row.label} className="thermal-slip__meta-row">
                            <span className="thermal-slip__meta-key">{row.label}</span>
                            <span className="thermal-slip__meta-val">{row.value}</span>
                        </div>
                    ))}
                </div>
            ) : null}

            <p className="thermal-slip__footer">{footer}</p>
            {printedAt ? <p className="thermal-slip__printed">Printed {printedAt}</p> : null}
        </article>
    );
}
