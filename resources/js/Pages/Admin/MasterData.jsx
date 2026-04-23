import GenericDataTable from '@/Components/MasterData/GenericDataTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ChevronDown, Database } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

import BuffetMenuManagement from '@/Pages/Admin/MasterData/BuffetMenuManagement';
import FoodCategoryManagement from '@/Pages/Admin/MasterData/FoodCategoryManagement';
import IngredientManagement from '@/Pages/Admin/MasterData/IngredientManagement';
import MenuManagement from '@/Pages/Admin/MasterData/MenuManagement';
import PromotionManagement from '@/Pages/Admin/MasterData/PromotionManagement';
import StaffManagement from '@/Pages/Admin/MasterData/StaffManagement';
import SupplierManagement from '@/Pages/Admin/MasterData/SupplierManagement';
import TableManagement from '@/Pages/Admin/MasterData/TableManagement';
import TierMapping from '@/Pages/Admin/MasterData/TierMapping';
import { buildPlaceholderColumns } from '@/Pages/Admin/MasterData/columnBuilders';
import { MASTER_DATA_PRIMARY, MASTER_DATA_SECTIONS } from '@/Pages/Admin/MasterData/constants';
import { resolveTierBindingId } from '@/Pages/Admin/MasterData/helpers';

// export ລາຍການພາກ — ບາງໄຟລ import ຈາກນີ້
export { MASTER_DATA_SECTIONS } from '@/Pages/Admin/MasterData/constants';

const primary = MASTER_DATA_PRIMARY;

// ໜ້າຈັດການຂໍ້ມູນພື້ນຖານ: ສະຫຼັບພາກ + ຜູກເມນູບຸບເຟ່; ຟອມຢູ່ໃນໂຕປະກອບແຍກ
export default function MasterData({
    section: initialSection,
    staff,
    buffetTiers,
    foodMenus,
    foodMenuCategories,
    foodCategories,
    tables,
    news,
    newsStaff,
    ingredients,
    suppliers,
    tierLinkBuffetTiers = [],
    tierLinkMenus = [],
    tierMenuLinks = {},
    selectedTierId: serverTierId = null,
}) {
    const { props } = usePage();
    const pageErrors = props.errors ?? {};
    const currentStaffId = props.auth?.user?.id ?? null;

    const [section, setSection] = useState(initialSection || 'staff');

    const tierBindingOptions = tierLinkBuffetTiers ?? [];
    const tierBindingMenus = tierLinkMenus ?? [];
    const tierBindingLinks = tierMenuLinks ?? {};
    const tierBindingLinksRef = useRef(tierBindingLinks);
    const [bindingTierId, setBindingTierId] = useState(() =>
        initialSection === 'tier_menu_binding' ? resolveTierBindingId(tierBindingOptions, serverTierId) : null
    );
    const [bindingChecked, setBindingChecked] = useState(() => new Set());
    const [bindingSaveBusy, setBindingSaveBusy] = useState(false);
    const [tierPivotLoading, setTierPivotLoading] = useState(false);
    const [viewSelectedOnly, setViewSelectedOnly] = useState(false);

    // ກັນຄ່າເມນູຜູກຈາກ props ເກົ່າເວລາ Inertia reload
    useEffect(() => {
        tierBindingLinksRef.current = tierBindingLinks;
    }, [tierBindingLinks]);

    // ກົງ URL ?section= ກັບ state
    useEffect(() => {
        setSection(initialSection || 'staff');
    }, [initialSection]);

    useEffect(() => {
        if (section !== 'tier_menu_binding') {
            return;
        }
        if (tierBindingOptions.length === 0) {
            setBindingTierId(null);
            return;
        }
        setBindingTierId((prev) => {
            if (prev != null && tierBindingOptions.some((t) => Number(t.id) === Number(prev))) {
                return Number(prev);
            }
            return resolveTierBindingId(tierBindingOptions, serverTierId);
        });
    }, [section, tierBindingOptions, serverTierId]);

    useEffect(() => {
        if (section !== 'tier_menu_binding') {
            setViewSelectedOnly(false);
        }
    }, [section]);

    // ດຶງ menu_ids ທີ່ຜູກກັບແພັກນີ້
    const fetchMenus = useCallback(async (tierId) => {
        if (tierId == null) {
            return;
        }
        setTierPivotLoading(true);
        try {
            const { data } = await axios.get(route('admin.buffet-tier-menus.show', tierId), {
                headers: { Accept: 'application/json' },
            });
            const ids = Array.isArray(data?.menu_ids) ? data.menu_ids.map((id) => Number(id)) : [];
            setBindingChecked(new Set(ids));
        } catch {
            const links = tierBindingLinksRef.current ?? {};
            const raw = links[tierId] ?? links[String(tierId)] ?? [];
            setBindingChecked(new Set(raw));
        } finally {
            setTierPivotLoading(false);
        }
    }, []);

    useEffect(() => {
        if (section !== 'tier_menu_binding' || bindingTierId == null) {
            return;
        }
        void fetchMenus(bindingTierId);
    }, [section, bindingTierId, fetchMenus]);

    const toggleMenu = useCallback((menuId) => {
        setBindingChecked((prev) => {
            const next = new Set(prev);
            if (next.has(menuId)) {
                next.delete(menuId);
            } else {
                next.add(menuId);
            }
            return next;
        });
    }, []);

    const syncMenus = useCallback(() => {
        if (bindingTierId == null) {
            return;
        }
        setBindingSaveBusy(true);
        router.put(route('admin.buffet-tier-menus.sync', bindingTierId), { menu_ids: Array.from(bindingChecked) }, {
            preserveScroll: true,
            onSuccess: () => {
                void Swal.fire({
                    icon: 'success',
                    title: 'ບັນທຶກການຜູກເມນູສຳເລັດແລ້ວ!',
                    confirmButtonText: 'ຕົກລົງ',
                    confirmButtonColor: primary,
                    buttonsStyling: true,
                    customClass: {
                        popup: 'rounded-2xl',
                        confirmButton: 'rounded-xl px-6 font-bold shadow-sm',
                    },
                });
            },
            onFinish: () => setBindingSaveBusy(false),
        });
    }, [bindingTierId, bindingChecked]);

    const staffRows = staff ?? [];
    const buffetRows = buffetTiers ?? [];
    const foodMenuCategoryRows = foodMenuCategories ?? [];
    const foodMenuRowsAll = foodMenus ?? [];
    const foodCategoryRowsAll = foodCategories ?? [];
    const tableRowsAll = tables ?? [];
    const newsRowsAll = news ?? [];
    const newsStaffOptions = newsStaff ?? [];
    const ingredientRowsAll = ingredients ?? [];
    const supplierRowsAll = suppliers ?? [];

    const placeholderColumns = useMemo(() => buildPlaceholderColumns(), []);

    const toolbarAlign = 'w-full max-w-md sm:ml-auto lg:ml-0';

    const goSection = (value) => {
        setSection(value);
        router.get(route('admin.master-data'), { section: value }, { preserveScroll: true, replace: true });
    };

    // ສະແດງຕາຕະລາງຕາມພາກທີ່ເລືອກ
    const renderPanel = () => {
        if (section === 'staff') {
            return (
                <StaffManagement
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                    rows={staffRows}
                    currentStaffId={currentStaffId}
                />
            );
        }
        if (section === 'buffet_menu') {
            return (
                <BuffetMenuManagement primaryColor={primary} toolbarClassName={toolbarAlign} rows={buffetRows} />
            );
        }
        if (section === 'food_menu') {
            return (
                <MenuManagement
                    primaryColor={primary}
                    rows={foodMenuRowsAll}
                    categoryRows={foodMenuCategoryRows}
                />
            );
        }
        if (section === 'food_categories') {
            return (
                <FoodCategoryManagement
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                    rows={foodCategoryRowsAll}
                />
            );
        }
        if (section === 'tables') {
            return <TableManagement primaryColor={primary} toolbarClassName={toolbarAlign} rows={tableRowsAll} />;
        }
        if (section === 'news') {
            return (
                <PromotionManagement
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                    rows={newsRowsAll}
                    staffOptions={newsStaffOptions}
                />
            );
        }
        if (section === 'ingredients_master') {
            return (
                <IngredientManagement
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                    rows={ingredientRowsAll}
                />
            );
        }
        if (section === 'suppliers') {
            return (
                <SupplierManagement
                    primaryColor={primary}
                    toolbarClassName={toolbarAlign}
                    rows={supplierRowsAll}
                />
            );
        }
        if (section === 'tier_menu_binding') {
            return (
                <TierMapping
                    primaryColor={primary}
                    tierBindingOptions={tierBindingOptions}
                    tierBindingMenus={tierBindingMenus}
                    bindingTierId={bindingTierId}
                    onBindingTierChange={setBindingTierId}
                    tierPivotLoading={tierPivotLoading}
                    bindingChecked={bindingChecked}
                    onToggleMenu={toggleMenu}
                    viewSelectedOnly={viewSelectedOnly}
                    onToggleViewSelectedOnly={() => setViewSelectedOnly((v) => !v)}
                    onSaveBinding={syncMenus}
                    bindingSaveBusy={bindingSaveBusy}
                />
            );
        }
        return (
            <GenericDataTable
                title={MASTER_DATA_SECTIONS.find((s) => s.value === section)?.label ?? ''}
                columns={placeholderColumns}
                rows={[]}
                searchKeys={[]}
                emptyMessage="ກຳລັງພັດທະນາ — ໃຊ້ຕາຕະລາງກົງກັນນີ້ເມນື່ອງມີ API."
                primaryColor={primary}
                toolbarClassName={toolbarAlign}
            />
        );
    };

    return (
        <AdminLayout title="ຈັດການຂໍ້ມູນພື້ນຖານ">
            <Head title="ຈັດການຂໍ້ມູນພື້ນຖານ" />

            <div className="-mx-4 -mt-2 bg-slate-50 px-4 pb-12 pt-4 md:-mx-8 md:px-8 md:pb-14 md:pt-6">
                <div className="mx-auto max-w-6xl space-y-10">
                    {/* ຂໍ້ຜິດຈາກເຊີເວີ (ຕາມໂດເມນ) */}
                    {pageErrors?.staff && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.staff}
                        </div>
                    )}
                    {pageErrors?.buffet_tier && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.buffet_tier}
                        </div>
                    )}
                    {pageErrors?.menu && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.menu}
                        </div>
                    )}
                    {pageErrors?.menu_category && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.menu_category}
                        </div>
                    )}
                    {pageErrors?.table && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.table}
                        </div>
                    )}
                    {pageErrors?.news && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.news}
                        </div>
                    )}
                    {pageErrors?.ingredient && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.ingredient}
                        </div>
                    )}
                    {pageErrors?.supplier && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            {pageErrors.supplier}
                        </div>
                    )}
                    {section === 'tier_menu_binding' && Object.keys(pageErrors).length > 0 && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm shadow-slate-200/40 sm:px-5">
                            <ul className="list-inside list-disc space-y-1">
                                {Object.entries(pageErrors).map(([key, val]) => (
                                    <li key={key}>{Array.isArray(val) ? val.join(' ') : String(val)}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* ເລືອກພາກຂໍ້ມູນ */}
                    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-200/80 sm:p-8">
                        <div className="flex items-start gap-4">
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 text-slate-700 shadow-sm"
                                aria-hidden
                            >
                                <Database className="h-6 w-6" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <label
                                    htmlFor="master-section"
                                    className="block text-xl font-bold tracking-tight text-[#0f2744] sm:text-2xl"
                                >
                                    ເລືອກປະເພດຂໍ້ມູນ
                                </label>
                                <p className="mt-1 text-sm text-slate-500">ເລືອກປະເພດຂໍ້ມູນທີ່ຕ້ອງການຈັດການ</p>
                            </div>
                        </div>

                        <div className="relative mt-5 max-w-md">
                            <select
                                id="master-section"
                                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-3.5 pl-4 pr-12 text-base font-semibold text-slate-800 shadow-sm outline-none transition hover:border-slate-300 hover:bg-slate-50/90 focus:border-[#194c9f] focus:ring-2 focus:ring-[#194c9f]/25"
                                value={section}
                                onChange={(e) => goSection(e.target.value)}
                            >
                                {MASTER_DATA_SECTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                                strokeWidth={2}
                                aria-hidden
                            />
                        </div>
                    </section>

                    {/* ຕາຕະລາງ ຫຼື ຜູກເມນູ */}
                    {renderPanel()}
                </div>
            </div>
        </AdminLayout>
    );
}
