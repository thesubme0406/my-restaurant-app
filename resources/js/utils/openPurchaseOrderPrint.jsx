import { createRoot } from 'react-dom/client';
import PurchaseOrderDocument from '@/Components/Print/PurchaseOrderDocument';
import purchaseOrderCssUrl from '@/Components/Print/PurchaseOrderDocument.css?url';

const PAGE_WIDTH_MM = 210;
const PAGE_MARGIN_MM = 10;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2;

function injectStyles(doc) {
    const fonts = doc.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href =
        'https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700;800&display=swap';
    doc.head.appendChild(fonts);

    const sheet = doc.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = purchaseOrderCssUrl;
    doc.head.appendChild(sheet);
}

/** Inject explicit A4 page dimensions so Chrome print dialog uses correct margins/size. */
function applyPurchaseOrderPrintPageSize(win) {
    const doc = win.document.querySelector('.purchase-order-doc');
    if (!doc) {
        return;
    }

    const pxPerMm = 96 / 25.4;
    const contentHeightMm = Math.ceil(doc.getBoundingClientRect().height / pxPerMm);
    const pageHeightMm = Math.max(contentHeightMm + PAGE_MARGIN_MM * 2, 297);

    win.document.querySelector('style[data-po-page-size]')?.remove();

    const style = win.document.createElement('style');
    style.setAttribute('data-po-page-size', '1');
    style.textContent = `
        html, body {
            width: ${CONTENT_WIDTH_MM}mm;
            margin: 0 auto;
            padding: 0;
            background: #fff;
        }

        .purchase-order-doc {
            width: ${CONTENT_WIDTH_MM}mm;
            max-width: ${CONTENT_WIDTH_MM}mm;
        }

        @media print {
            @page {
                size: ${PAGE_WIDTH_MM}mm ${pageHeightMm}mm;
                margin: ${PAGE_MARGIN_MM}mm;
            }

            html, body {
                width: ${CONTENT_WIDTH_MM}mm !important;
                margin: 0 auto !important;
                padding: 0 !important;
                background: #fff !important;
            }

            .purchase-order-doc {
                width: ${CONTENT_WIDTH_MM}mm !important;
                max-width: ${CONTENT_WIDTH_MM}mm !important;
                margin: 0 !important;
            }
        }
    `;
    win.document.head.appendChild(style);
}

function whenDocumentReady(win, callback) {
    const doc = win.document.querySelector('.purchase-order-doc');
    if (!doc) {
        window.setTimeout(() => whenDocumentReady(win, callback), 50);
        return;
    }

    const finish = () => {
        applyPurchaseOrderPrintPageSize(win);
        callback();
    };

    const images = [...win.document.images].filter((img) => !img.complete);
    if (images.length === 0) {
        if (win.document.fonts?.ready) {
            win.document.fonts.ready.then(finish).catch(finish);
        } else {
            finish();
        }
        return;
    }

    let settled = 0;
    const onSettled = () => {
        settled += 1;
        if (settled >= images.length) {
            finish();
        }
    };

    images.forEach((img) => {
        img.addEventListener('load', onSettled);
        img.addEventListener('error', onSettled);
    });
}

/**
 * Open purchase order in a new window and trigger the browser print dialog (Save as PDF).
 * @param {Record<string, unknown>} payload
 */
export function openPurchaseOrderPrint(payload) {
    if (!payload?.po_no || !Array.isArray(payload.items) || payload.items.length === 0) {
        return;
    }

    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) {
        return;
    }

    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html lang="lo">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#fff}
  body{display:flex;justify-content:center;padding:16px 0}
</style>
</head>
<body></body>
</html>`);
    win.document.close();

    win.document.documentElement.lang = 'lo';
    win.document.title = `PO-${payload.po_no}`;
    injectStyles(win.document);

    const body = win.document.body;
    body.style.margin = '0';
    body.style.background = '#fff';

    const mount = win.document.createElement('div');
    body.appendChild(mount);

    const root = createRoot(mount);
    root.render(
        <PurchaseOrderDocument
            poNo={String(payload.po_no)}
            poDate={String(payload.po_date ?? '—')}
            poStatus={String(payload.po_status ?? 'Pending')}
            supplier={payload.supplier ?? {}}
            items={payload.items}
            staffName={String(payload.staff_name ?? '—')}
            printedAt={payload.printed_at}
        />
    );

    whenDocumentReady(win, () => {
        win.focus();
        win.print();
    });
}
