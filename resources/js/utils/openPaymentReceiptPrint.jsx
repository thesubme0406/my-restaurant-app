import { createRoot } from 'react-dom/client';
import PaymentReceipt from '@/Components/Admin/Payments/PaymentReceipt';
import { buildPaymentReceiptProps } from '@/utils/paymentReceiptModel';
import receiptCssUrl from '@/Components/Admin/Payments/PaymentReceipt.css?url';

function injectStyles(doc) {
    const fonts = doc.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href =
        'https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700&display=swap';
    doc.head.appendChild(fonts);

    const sheet = doc.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = receiptCssUrl;
    doc.head.appendChild(sheet);
}

const RECEIPT_WIDTH_MM = 80;

/** Fit PDF / print page to thermal receipt width and measured content height. */
function applyReceiptPrintPageSize(win) {
    const receipt = win.document.querySelector('.payment-receipt');
    if (!receipt) {
        return;
    }

    const pxPerMm = 96 / 25.4;
    const contentHeightMm = Math.ceil(receipt.getBoundingClientRect().height / pxPerMm);
    const pageHeightMm = Math.max(contentHeightMm + 8, 60);

    win.document.querySelector('style[data-receipt-page-size]')?.remove();

    const style = win.document.createElement('style');
    style.setAttribute('data-receipt-page-size', '1');
    style.textContent = `
        html, body {
            width: ${RECEIPT_WIDTH_MM}mm;
            margin: 0 auto;
            padding: 0;
            background: #fff;
        }

        .payment-receipt {
            width: ${RECEIPT_WIDTH_MM}mm;
            max-width: ${RECEIPT_WIDTH_MM}mm;
            margin: 0;
        }

        @media print {
            @page {
                size: ${RECEIPT_WIDTH_MM}mm ${pageHeightMm}mm;
                margin: 0;
            }

            html, body {
                width: ${RECEIPT_WIDTH_MM}mm !important;
                min-height: ${pageHeightMm}mm !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            .payment-receipt {
                width: ${RECEIPT_WIDTH_MM}mm !important;
                max-width: ${RECEIPT_WIDTH_MM}mm !important;
                margin: 0 !important;
                padding: 4mm !important;
            }
        }
    `;
    win.document.head.appendChild(style);
}

function whenReceiptReady(win, callback) {
    const receipt = win.document.querySelector('.payment-receipt');
    if (!receipt) {
        window.setTimeout(() => whenReceiptReady(win, callback), 50);
        return;
    }

    const finish = () => {
        applyReceiptPrintPageSize(win);
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
 * ເປີດໜ້າຕ່າງພິມທີ່ມີແຕ່ PaymentReceipt (ບໍ່ມີແຖບນຳທາງ / ແຜງຂ້າງ).
 * @param {Record<string, unknown>} row — ແຖວຈາກ Inertia payments list
 */
export function openPaymentReceiptPrint(row) {
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
    win.document.title = 'Bill';
    injectStyles(win.document);

    const body = win.document.body;
    body.style.margin = '0';
    body.style.background = '#fff';

    const mount = win.document.createElement('div');
    body.appendChild(mount);

    const root = createRoot(mount);
    root.render(<PaymentReceipt {...buildPaymentReceiptProps(row)} />);

    whenReceiptReady(win, () => {
        win.focus();
        win.print();
    });
}
