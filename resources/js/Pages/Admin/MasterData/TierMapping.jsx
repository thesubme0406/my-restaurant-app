import BuffetTierMapping from '@/Components/MasterData/BuffetTierMapping';
import { formatBuffetPrice } from './helpers';
import { ListChecks, Loader2 } from 'lucide-react';

// ຜູກເມນູຕໍ່ປະເພດບຸບເຟ່; ສີຟ້າ #194c9f = MASTER_DATA_PRIMARY (constants.js)
export default function TierMapping({
    primaryColor,
    tierBindingOptions,
    tierBindingMenus,
    bindingTierId,
    onBindingTierChange,
    tierPivotLoading,
    bindingChecked,
    onToggleMenu,
    viewSelectedOnly,
    onToggleViewSelectedOnly,
    onSaveBinding,
    bindingSaveBusy,
}) {
    const selectedTier = tierBindingOptions.find((t) => Number(t.id) === Number(bindingTierId));

    return (
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-200/80 sm:p-8">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#0f2744]">ການຜູກເມນູ</h2>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">
                        ເລືອກປະເພດບຸບເຟ່ (ເຊັ່ນ Silver, Gold, Deluxe) ແລະ ເລືອກລາຍການອາຫານທີ່ລູກຄ້າຈະເຫັນໃນແອັບສຳລັບປະເພດນັ້ນເທົ່ານັ້ນ.
                    </p>
                </div>
            </div>

            {tierBindingOptions.length === 0 ? (
                <p className="mt-8 text-center text-slate-600">
                    ຍັງບໍ່ມີປະເພດບຸບເຟ່ — ເພີ່ມໃນພາກ «ຈັດການຂໍ້ມູນເມນູບຸບເຟ່» ກ່ອນ.
                </p>
            ) : (
                <>
                    <div className="mt-6 max-w-md">
                        <label htmlFor="tier-binding-select" className="block text-sm font-semibold text-slate-700">
                            ປະເພດບຸບເຟ່
                        </label>
                        <select
                            id="tier-binding-select"
                            className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/25 disabled:cursor-wait disabled:opacity-70"
                            value={bindingTierId ?? ''}
                            disabled={tierPivotLoading}
                            onChange={(e) => onBindingTierChange(e.target.value ? Number(e.target.value) : null)}
                        >
                            {tierBindingOptions.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.tier_name} — {formatBuffetPrice(t.price)}
                                </option>
                            ))}
                        </select>
                        {tierPivotLoading ? (
                            <p className="mt-2 flex items-center gap-2 text-xs font-medium text-[#194c9f]">
                                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                                ກຳລັງໂຫຼດການຜູກເມນູຈາກຖານຂໍ້ມູນ…
                            </p>
                        ) : null}
                    </div>

                    <div className="mt-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {viewSelectedOnly ? 'ເມນູທີ່ເລືອກໄວ້' : 'ລາຍການອາຫານທັງໝົດ'}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    ລາຍການທັງໝົດ <span className="font-bold text-slate-700">{tierBindingMenus.length}</span>
                                    {' · '}
                                    ເລືອກແລ້ວສຳລັບປະເພດນີ້{' '}
                                    <span className="font-bold text-[#194c9f]">{bindingChecked.size}</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <button
                                    type="button"
                                    onClick={onToggleViewSelectedOnly}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold shadow-sm transition ${
                                        viewSelectedOnly
                                            ? 'border-[#194c9f] bg-[#194c9f] text-white'
                                            : 'border-[#194c9f]/30 bg-white text-[#194c9f] hover:border-[#194c9f] hover:bg-slate-50'
                                    }`}
                                >
                                    <ListChecks className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                                    ເບິ່ງເມນູທີ່ເລືອກໄວ້
                                </button>
                                <button
                                    type="button"
                                    onClick={onSaveBinding}
                                    disabled={bindingSaveBusy || bindingTierId == null || tierPivotLoading}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition disabled:opacity-50"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {bindingSaveBusy ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                            ກຳລັງບັນທຶກ…
                                        </>
                                    ) : (
                                        'ບັນທຶກການຜູກເມນູ'
                                    )}
                                </button>
                            </div>
                        </div>
                        {selectedTier ? (
                            <p className="mt-2 text-xs text-slate-500">
                                ກຳລັງແກ້ໄຂ: <span className="font-semibold text-slate-700">{selectedTier.tier_name}</span>
                            </p>
                        ) : null}

                        {tierBindingMenus.length === 0 ? (
                            <p className="mt-6 text-center text-slate-600">
                                ຍັງບໍ່ມີລາຍການອາຫານ — ເພີ່ມໃນພາກ «ຈັດການຂໍ້ມູນລາຍການອາຫານ» ກ່ອນ.
                            </p>
                        ) : (
                            <BuffetTierMapping
                                key={bindingTierId ?? 'none'}
                                menus={tierBindingMenus}
                                checked={bindingChecked}
                                onToggle={onToggleMenu}
                                viewSelectedOnly={viewSelectedOnly}
                                tierPivotLoading={tierPivotLoading}
                                bindingSaveBusy={bindingSaveBusy}
                                primaryColor={primaryColor}
                            />
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
