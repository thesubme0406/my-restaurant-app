import { createRoot } from 'react-dom/client';
import thermalSlipCssUrl from '@/Components/Print/thermalSlip.css?url';

function injectDocumentStyles(doc) {
    const fonts = doc.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href =
        'https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700;800&display=swap';
    doc.head.appendChild(fonts);

    const sheet = doc.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = thermalSlipCssUrl;
    doc.head.appendChild(sheet);
}

/**
 * Print a thermal slip in a dedicated window (same approach as payment receipts).
 * @param {{ title: string, Component: import('react').ComponentType<any>, props?: Record<string, unknown> }} options
 */
export function printThermalSlip({ title, Component, props = {} }) {
    const win = window.open('', '_blank', 'width=400,height=840');
    if (!win) {
        return;
    }

    win.document.open();
    win.document.write(
        '<!DOCTYPE html><html lang="lo"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body></body></html>'
    );
    win.document.close();

    win.document.documentElement.lang = 'lo';
    win.document.title = title;
    injectDocumentStyles(win.document);

    const body = win.document.body;
    body.style.margin = '0';
    body.style.background = '#fff';

    const mount = win.document.createElement('div');
    body.appendChild(mount);

    const root = createRoot(mount);
    root.render(<Component {...props} />);

    const runPrint = () => {
        try {
            win.focus();
            win.print();
        } catch {
            // ignore blocked print
        }
    };

    if (win.document?.fonts?.ready) {
        win.document.fonts.ready.then(() => setTimeout(runPrint, 500)).catch(() => setTimeout(runPrint, 700));
    } else {
        setTimeout(runPrint, 700);
    }
}

/** @deprecated Use printThermalSlip */
export function openThermalPrint(options) {
    printThermalSlip(options);
}
