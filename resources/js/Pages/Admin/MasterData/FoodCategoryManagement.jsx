import ConfirmDialog from '@/Components/MasterData/ConfirmDialog';
import GenericDataTable from '@/Components/MasterData/GenericDataTable';
import GenericFormModal from '@/Components/MasterData/GenericFormModal';
import { router, useForm } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { buildFoodCategoryColumns } from '@/Pages/Admin/MasterData/columnBuilders';
import { categoryFormSchema } from '@/Pages/Admin/MasterData/formSchemas';

// ປະເພດອາຫານ: ຕາຕະລາງ + ຟອມ + ຢືນຢັນລຶບ
export default function FoodCategoryManagement({ primaryColor, toolbarClassName, rows }) {
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const addForm = useForm({
        image: null,
        image_url: '',
        catg_name: '',
    });

    const editForm = useForm({
        image: null,
        image_url: '',
        catg_name: '',
    });

    const openAdd = useCallback(() => {
        addForm.clearErrors();
        addForm.setData({
            image: null,
            image_url: '',
            catg_name: '',
        });
        setAddOpen(true);
    }, [addForm]);

    const openEdit = useCallback(
        (row) => {
            editForm.clearErrors();
            editForm.setData({
                image: null,
                image_url: row.image_url ?? '',
                catg_name: row.catg_name ?? '',
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
        addForm.post(route('admin.menu-categories.store'), {
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
        editForm.post(route('admin.menu-categories.update', editing.id), {
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
        router.delete(route('admin.menu-categories.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleteBusy(false);
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget]);

    const columns = useMemo(
        () => buildFoodCategoryColumns({ onEdit: openEdit, onDelete: askDelete }),
        [openEdit, askDelete]
    );

    return (
        <>
            <GenericDataTable
                title="ຂໍ້ມູນປະເພດອາຫານ"
                columns={columns}
                rows={rows}
                searchKeys={['catg_name']}
                searchPlaceholder="ຄົ້ນຫາ…"
                totalCount={rows.length}
                totalLabel="ທັງໝົດ"
                countSuffix="ລາຍການ"
                emptyMessage="ຍັງບໍ່ມີປະເພດອາຫານ"
                onAdd={openAdd}
                addButtonLabel="ເພີ່ມປະເພດອາຫານ"
                primaryColor={primaryColor}
                toolbarClassName={toolbarClassName}
            />

            <GenericFormModal
                open={addOpen}
                onClose={() => !addForm.processing && setAddOpen(false)}
                title="ເພີ່ມປະເພດອາຫານ"
                submitLabel="ບັນທຶກປະເພດອາຫານ"
                formId="master-add-menu-catg"
                schema={categoryFormSchema('add')}
                data={addForm.data}
                setData={addForm.setData}
                errors={addForm.errors}
                processing={addForm.processing}
                onSubmit={saveNew}
                primaryColor={primaryColor}
                panelMaxClassName="sm:max-w-lg"
                splitLeadImage
            />

            <GenericFormModal
                open={Boolean(editing)}
                onClose={() => !editForm.processing && setEditing(null)}
                title="ແກ້ໄຂປະເພດອາຫານ"
                submitLabel="ບັນທຶກການແກ້ໄຂ"
                formId="master-edit-menu-catg"
                schema={categoryFormSchema('edit')}
                data={editForm.data}
                setData={editForm.setData}
                errors={editForm.errors}
                processing={editForm.processing}
                onSubmit={saveEdit}
                primaryColor={primaryColor}
                panelMaxClassName="sm:max-w-lg"
                splitLeadImage
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onClose={() => !deleteBusy && setDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    deleteTarget
                        ? `ທ່ານຕ້ອງການລຶບປະເພດ “${deleteTarget.catg_name}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
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
