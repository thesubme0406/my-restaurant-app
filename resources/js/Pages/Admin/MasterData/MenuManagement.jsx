import ConfirmDialog from '@/Components/MasterData/ConfirmDialog';
import GenericDataTable from '@/Components/MasterData/GenericDataTable';
import GenericFormModal from '@/Components/MasterData/GenericFormModal';
import { router, useForm } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { buildFoodMenuColumns } from '@/Pages/Admin/MasterData/columnBuilders';
import { buildMenuFormSchema } from '@/Pages/Admin/MasterData/formSchemas';

// ເມນູອາຫານ: ກອງໝວດໝູ່ + ຟອມ + ຢືນຢັນລຶບ
export default function MenuManagement({ primaryColor, rows, categoryRows }) {
    const [categoryFilter, setCategoryFilter] = useState('');

    const categoryFilterOptions = useMemo(
        () =>
            (categoryRows ?? []).map((c) => ({
                value: String(c.id),
                label: c.category_name,
            })),
        [categoryRows]
    );

    const displayRows = useMemo(() => {
        if (!categoryFilter) {
            return rows ?? [];
        }
        return (rows ?? []).filter((r) => String(r.category_id) === categoryFilter);
    }, [rows, categoryFilter]);

    const menuFields = useMemo(() => buildMenuFormSchema(categoryRows ?? []), [categoryRows]);

    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const addForm = useForm({
        image: null,
        image_url: '',
        name: '',
        category_id: '',
        is_active: '1',
        description: '',
    });

    const editForm = useForm({
        image: null,
        image_url: '',
        name: '',
        category_id: '',
        is_active: '1',
        description: '',
    });

    const openAdd = useCallback(() => {
        addForm.clearErrors();
        const firstCat = (categoryRows ?? [])[0];
        addForm.setData({
            image: null,
            image_url: '',
            name: '',
            category_id: firstCat ? String(firstCat.id) : '',
            is_active: '1',
            description: '',
        });
        setAddOpen(true);
    }, [addForm, categoryRows]);

    const openEdit = useCallback(
        (row) => {
            editForm.clearErrors();
            editForm.setData({
                image: null,
                image_url: row.image_url ?? '',
                name: row.name ?? '',
                category_id: row.category_id != null ? String(row.category_id) : '',
                is_active: row.is_active ? '1' : '0',
                description: row.description ?? '',
            });
            setEditing(row);
        },
        [editForm]
    );

    const askDelete = useCallback((row) => {
        setDeleteTarget(row);
    }, []);

    const saveNew = (e) => {
        e.preventDefault();
        addForm.post(route('admin.menus.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setAddOpen(false),
        });
    };

    const saveEdit = (e) => {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.post(route('admin.menus.update', editing.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setEditing(null),
        });
    };

    const execDelete = useCallback(() => {
        const id = deleteTarget?.id;
        if (id == null) {
            return;
        }
        setDeleteBusy(true);
        router.delete(route('admin.menus.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleteBusy(false);
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget]);

    const columns = useMemo(
        () => buildFoodMenuColumns({ onEdit: openEdit, onDelete: askDelete }),
        [openEdit, askDelete]
    );

    const hasCategories = (categoryRows ?? []).length > 0;

    return (
        <>
            <GenericDataTable
                title="ຂໍ້ມູນລາຍການອາຫານ"
                columns={columns}
                rows={displayRows}
                searchKeys={['name', 'description', 'category_name']}
                searchPlaceholder="ຄົ້ນຫາ…"
                totalCount={displayRows.length}
                totalLabel="ທັງໝົດ"
                countSuffix="ລາຍການ"
                emptyMessage="ຍັງບໍ່ມີລາຍການອາຫານ"
                onAdd={hasCategories ? openAdd : undefined}
                addButtonLabel="ເພີ່ມລາຍການອາຫານ"
                primaryColor={primaryColor}
                toolbarClassName="w-full lg:ml-0"
                categoryFilter={{
                    value: categoryFilter,
                    onChange: setCategoryFilter,
                    options: categoryFilterOptions,
                    allLabel: 'ທຸກໝວດໝູ່',
                }}
            />

            <GenericFormModal
                open={addOpen}
                onClose={() => !addForm.processing && setAddOpen(false)}
                title="ຟອມເພີ່ມຂໍ້ມູນລາຍການອາຫານ"
                submitLabel="ເພີ່ມຂໍ້ມູນອາຫານ"
                formId="master-add-menu"
                schema={menuFields('add')}
                data={addForm.data}
                setData={addForm.setData}
                errors={addForm.errors}
                processing={addForm.processing}
                onSubmit={saveNew}
                primaryColor={primaryColor}
                panelMaxClassName="sm:max-w-2xl"
                splitLeadImage
            />

            <GenericFormModal
                open={Boolean(editing)}
                onClose={() => !editForm.processing && setEditing(null)}
                title="ຟອມແກ້ໄຂຂໍ້ມູນລາຍການອາຫານ"
                submitLabel="ບັນທຶກການແກ້ໄຂ"
                formId="master-edit-menu"
                schema={menuFields('edit')}
                data={editForm.data}
                setData={editForm.setData}
                errors={editForm.errors}
                processing={editForm.processing}
                onSubmit={saveEdit}
                primaryColor={primaryColor}
                panelMaxClassName="sm:max-w-2xl"
                splitLeadImage
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onClose={() => !deleteBusy && setDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    deleteTarget
                        ? `ທ່ານຕ້ອງການລຶບລາຍການ “${deleteTarget.name}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
                        : ''
                }
                cancelLabel="ຍົກເລີກ"
                confirmLabel="ລຶບຖາວອນ"
                onConfirm={execDelete}
                processing={deleteBusy}
                primaryColor={primaryColor}
            />
        </>
    );
}
