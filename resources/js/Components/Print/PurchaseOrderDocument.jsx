import { formatAmount } from '@/utils/formatAmount';
import { formatPrintDateTime } from '@/utils/printDateTime';
import './PurchaseOrderDocument.css';

/**
 * @param {{
 *   logoSrc?: string;
 *   businessName?: string;
 *   businessAddress?: string;
 *   businessPhone?: string;
 *   poNo: string;
 *   poDate: string;
 *   poStatus?: string;
 *   supplier: { name?: string; contact_person?: string; contact_tel?: string; address?: string };
 *   items: Array<{ ing_name?: string; quantity?: number | string; ing_unit?: string }>;
 *   staffName?: string;
 *   printedAt?: string;
 * }} props
 */
export default function PurchaseOrderDocument({
    logoSrc = '/images/oshinei-logo.png',
    businessName = 'OSHINEI RESTAURANT',
    businessAddress = 'ບ້ານ ສະພານທອງ, ເມືອງ ໄຊເສດຖາ, ນະຄອນຫຼວງວຽງຈັນ',
    businessPhone = '021 454 565, 020 59 494 465',
    poNo,
    poDate,
    poStatus = 'Pending',
    supplier = {},
    items = [],
    staffName = '—',
    printedAt,
}) {
    const printedLabel = printedAt ? formatPrintDateTime(printedAt) : undefined;

    return (
        <article className="purchase-order-doc" lang="lo" aria-label="ໃບສັ່ງຊື້">
            <header className="purchase-order-doc__banner">
                <div className="purchase-order-doc__brand">
                    <img className="purchase-order-doc__logo" src={logoSrc} alt="" width={64} height={64} />
                    <div>
                        <p className="purchase-order-doc__business">{businessName}</p>
                        <p className="purchase-order-doc__contact">{businessAddress}</p>
                        <p className="purchase-order-doc__contact">ໂທ: {businessPhone}</p>
                    </div>
                </div>
                <div className="purchase-order-doc__title-block">
                    <h1 className="purchase-order-doc__title">ໃບສັ່ງຊື້</h1>
                    <p className="purchase-order-doc__title-sub">Purchase Order</p>
                    <p className="purchase-order-doc__po-no">PO-{poNo}</p>
                </div>
            </header>

            <div className="purchase-order-doc__body">
                <section className="purchase-order-doc__info-grid">
                    <div className="purchase-order-doc__info-card">
                        <p className="purchase-order-doc__info-card-head">ຜູ້ສະໜອງ / Supplier</p>
                        <div className="purchase-order-doc__info-card-body">
                            <p className="purchase-order-doc__info-name">{supplier.name || '—'}</p>
                            {supplier.contact_person ? (
                                <p className="purchase-order-doc__info-line">ຜູ້ຕິດຕໍ່: {supplier.contact_person}</p>
                            ) : null}
                            {supplier.contact_tel ? (
                                <p className="purchase-order-doc__info-line">ໂທ: {supplier.contact_tel}</p>
                            ) : null}
                            {supplier.address ? (
                                <p className="purchase-order-doc__info-line">{supplier.address}</p>
                            ) : null}
                        </div>
                    </div>

                    <div className="purchase-order-doc__info-card">
                        <p className="purchase-order-doc__info-card-head">ລາຍລະອຽດໃບສັ່ງຊື້ / Order Details</p>
                        <div className="purchase-order-doc__info-card-body">
                            <div className="purchase-order-doc__info-row">
                                <span className="purchase-order-doc__info-key">ເລກທີ PO</span>
                                <span className="purchase-order-doc__info-val">PO-{poNo}</span>
                            </div>
                            <div className="purchase-order-doc__info-row">
                                <span className="purchase-order-doc__info-key">ວັນທີສັ່ງຊື້</span>
                                <span className="purchase-order-doc__info-val">{poDate || '—'}</span>
                            </div>
                            <div className="purchase-order-doc__info-row">
                                <span className="purchase-order-doc__info-key">ສະຖານະ</span>
                                <span className="purchase-order-doc__info-val">
                                    <span className="purchase-order-doc__status">{poStatus || '—'}</span>
                                </span>
                            </div>
                            <div className="purchase-order-doc__info-row">
                                <span className="purchase-order-doc__info-key">ຜູ້ສັ່ງຊື້</span>
                                <span className="purchase-order-doc__info-val">{staffName || '—'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <p className="purchase-order-doc__section-title">ລາຍການວັດຖຸດິບ / Items Ordered</p>
                <table className="purchase-order-doc__table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>ວັດຖຸດິບ / Item</th>
                            <th>ຈຳນວນ / Qty</th>
                            <th>ຫົວໜ່ວຍ / Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={`${item.ing_name}-${idx}`}>
                                <td>{idx + 1}</td>
                                <td>{item.ing_name || '—'}</td>
                                <td className="nums">{formatAmount(Number(item.quantity) || 0)}</td>
                                <td>{item.ing_unit || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="purchase-order-doc__notes">
                    <p>
                        ກະລຸນາສົ່ງສິນຄ້າຕາມຈຳນວນຂ້າງເທິງ ພ້ອມໃບກຳກັບການສົ່ງ. ຫາກມີຂໍ້ສົງໄສ ກະລຸນາຕິດຕໍ່ພວກເຮົາກ່ອນສົ່ງ.
                    </p>
                </div>

                <div className="purchase-order-doc__signatures">
                    <div className="purchase-order-doc__sig-block">
                        <div className="purchase-order-doc__sig-line" />
                        <p className="purchase-order-doc__sig-label">ຜູ້ອະນຸມັດ / Authorized By</p>
                        <p className="purchase-order-doc__sig-name">{staffName || '—'}</p>
                    </div>
                    <div className="purchase-order-doc__sig-block">
                        <div className="purchase-order-doc__sig-line" />
                        <p className="purchase-order-doc__sig-label">ຜູ້ຮັບເຄື່ອງ / Received By</p>
                        <p className="purchase-order-doc__sig-name">&nbsp;</p>
                    </div>
                </div>

                {printedLabel ? (
                    <p className="purchase-order-doc__printed">ພິມເມື່ອ: {printedLabel}</p>
                ) : null}
            </div>
        </article>
    );
}
