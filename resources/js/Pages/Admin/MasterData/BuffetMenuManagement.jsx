import ConfirmDialog from '@/Components/MasterData/ConfirmDialog';
import GenericDataTable from '@/Components/MasterData/GenericDataTable';
import GenericFormModal from '@/Components/MasterData/GenericFormModal';
import { router, useForm } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { buildBuffetColumns } from '@/Pages/Admin/MasterData/columnBuilders';
import { buffetFormSchema } from '@/Pages/Admin/MasterData/formSchemas';

// ບຸບເຟ່: ຕາຕະລາງ + ຟອມ + ຢືນຢັນລຶບ
export default function BuffetMenuManagement({ primaryColor, toolbarClassName, rows }) {
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const addForm = useForm({
        image: null,
        image_url: '',
        tier_name: '',
        price: '',
        description: '',
    });

    const editForm = useForm({
        image: null,
        image_url: '',
        tier_name: '',
        price: '',
        description: '',
    });

    const openAdd = useCallback(() => {
        addForm.clearErrors();
        addForm.setData({
            image: null,
            image_url: '',
            tier_name: '',
            price: '',
            description: '',
        });
        setAddOpen(true);
    }, [addForm]);

    const openEdit = useCallback(
        (row) => {
            editForm.clearErrors();
            editForm.setData({
                image: null,
                image_url: row.image_url ?? '',
                tier_name: row.tier_name ?? '',
                price: row.price != null ? String(row.price) : '',
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
        addForm.post(route('admin.buffet-tiers.store'), {
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
        // ແກ້ໄຂໃຊ້ POST+multipart (ຮູບ) — ຫຼີກລ້ຽງ PATCH ກັບໄຟລ
        editForm.post(route('admin.buffet-tiers.update', editing.id), {
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
        router.delete(route('admin.buffet-tiers.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleteBusy(false);
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget]);

    const columns = useMemo(
        () => buildBuffetColumns({ onEdit: openEdit, onDelete: askDelete }),
        [openEdit, askDelete]
    );

    return (
        <>
            <GenericDataTable
                title="ຂໍ້ມູນປະເພດບຸບເຟ່"
                columns={columns}
                rows={rows}
                searchKeys={['tier_name', 'description']}
                searchPlaceholder="ຄົ້ນຫາ…"
                totalCount={rows.length}
                totalLabel="ທັງໝົດ"
                countSuffix="ລາຍການ"
                emptyMessage="ຍັງບໍ່ມີປະເພດບຸບເຟ່"
                onAdd={openAdd}
                addButtonLabel="ເພີ່ມປະເພດບຸບເຟ່"
                primaryColor={primaryColor}
                toolbarClassName={toolbarClassName}
            />

            <GenericFormModal
                open={addOpen}
                onClose={() => !addForm.processing && setAddOpen(false)}
                title="ຟອມເພີ່ມຂໍ້ມູນບຸບເຟ່"
                submitLabel="ເພີ່ມເມນູບຸບເຟ່"
                formId="master-add-buffet-tier"
                schema={buffetFormSchema('add')}
                data={addForm.data}
                setData={addForm.setData}
                errors={addForm.errors}
                processing={addForm.processing}
                onSubmit={saveNew}
                primaryColor={primaryColor}
                panelMaxClassName="sm:max-w-lg"
            />

            <GenericFormModal
                open={Boolean(editing)}
                onClose={() => !editForm.processing && setEditing(null)}
                title="ຟອມແກ້ໄຂຂໍ້ມູນບຸບເຟ່"
                submitLabel="ບັນທຶກການແກ້ໄຂ"
                formId="master-edit-buffet-tier"
                schema={buffetFormSchema('edit')}
                data={editForm.data}
                setData={editForm.setData}
                errors={editForm.errors}
                processing={editForm.processing}
                onSubmit={saveEdit}
                primaryColor={primaryColor}
                panelMaxClassName="sm:max-w-lg"
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onClose={() => !deleteBusy && setDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    deleteTarget
                        ? `ທ່ານຕ້ອງການລຶບປະເພດບຸບເຟ່ “${deleteTarget.tier_name}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
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
