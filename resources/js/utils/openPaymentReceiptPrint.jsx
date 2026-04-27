import { createRoot } from 'react-dom/client';
import PaymentReceipt from '@/Components/Admin/Payments/PaymentReceipt';
import { buildPaymentReceiptProps } from '@/utils/paymentReceiptModel';
import receiptCssUrl from '@/Components/Admin/Payments/PaymentReceipt.css?url';

function injectStyles(doc) {
    const fonts = doc.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href =
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Lao:wght@400;600;700&display=swap';
    doc.head.appendChild(fonts);

    const sheet = doc.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = receiptCssUrl;
    doc.head.appendChild(sheet);
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

    setTimeout(() => {
        win.focus();
        win.print();
    }, 500);
}
