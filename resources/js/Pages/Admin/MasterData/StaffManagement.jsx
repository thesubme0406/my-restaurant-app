import ConfirmDialog from '@/Components/MasterData/ConfirmDialog';
import GenericDataTable from '@/Components/MasterData/GenericDataTable';
import GenericFormModal from '@/Components/MasterData/GenericFormModal';
import { router, useForm } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { buildStaffColumns } from '@/Pages/Admin/MasterData/columnBuilders';
import { staffFormSchema } from '@/Pages/Admin/MasterData/formSchemas';

// ພະນັກງານ: ຕາຕະລາງ + ຟອມ + ຢືນຢັນລຶບ
export default function StaffManagement({ primaryColor, toolbarClassName, rows, currentStaffId }) {
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const addForm = useForm({
        name: '',
        surname: '',
        phone: '',
        username: '',
        password: '',
        role: 'staff',
        address: '',
    });

    const editForm = useForm({
        name: '',
        surname: '',
        phone: '',
        username: '',
        password: '',
        role: 'staff',
        address: '',
    });

    const openAdd = useCallback(() => {
        addForm.reset();
        addForm.setData({
            name: '',
            surname: '',
            phone: '',
            username: '',
            password: '',
            role: 'staff',
            address: '',
        });
        setAddOpen(true);
    }, [addForm]);

    const openEdit = useCallback(
        (row) => {
            editForm.clearErrors();
            editForm.setData({
                name: row.name ?? '',
                surname: row.surname ?? '',
                phone: row.phone ?? '',
                username: row.username ?? '',
                password: '',
                role: row.role ?? 'staff',
                address: row.address ?? '',
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
        addForm.post(route('admin.staff.store'), {
            preserveScroll: true,
            onSuccess: () => setAddOpen(false),
        });
    };

    const saveEdit = (e) => {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.patch(route('admin.staff.update', editing.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    };

    const execDelete = useCallback(() => {
        const id = deleteTarget?.id;
        if (id == null) {
            return;
        }
        setDeleteBusy(true);
        router.delete(route('admin.staff.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleteBusy(false);
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget]);

    const columns = useMemo(
        () =>
            buildStaffColumns({
                primaryColor,
                currentStaffId,
                onEdit: openEdit,
                onDelete: askDelete,
            }),
        [primaryColor, currentStaffId, openEdit, askDelete]
    );

    return (
        <>
            <GenericDataTable
                title="ຂໍ້ມູນພະນັກງານ"
                columns={columns}
                rows={rows}
                searchKeys={['name', 'surname', 'phone', 'username']}
                searchPlaceholder="ຄົ້ນຫາ…"
                totalCount={rows.length}
                totalLabel="ທັງໝົດ"
                countSuffix="ຄົນ"
                emptyMessage="ຍັງບໍ່ມີພະນັກງານ"
                onAdd={openAdd}
                addButtonLabel="ເພີ່ມພະນັກງານ"
                primaryColor={primaryColor}
                toolbarClassName={toolbarClassName}
            />

            <GenericFormModal
                open={addOpen}
                onClose={() => !addForm.processing && setAddOpen(false)}
                title="ຟອມເພີ່ມພະນັກງານ"
                submitLabel="ເພີ່ມພະນັກງານ"
                formId="master-add-staff"
                schema={staffFormSchema('add')}
                data={addForm.data}
                setData={addForm.setData}
                errors={addForm.errors}
                processing={addForm.processing}
                onSubmit={saveNew}
                primaryColor={primaryColor}
            />

            <GenericFormModal
                open={Boolean(editing)}
                onClose={() => !editForm.processing && setEditing(null)}
                title="ຟອມແກ້ໄຂຂໍ້ມູນພະນັກງານ"
                submitLabel="ບັນທຶກການແກ້ໄຂ"
                formId="master-edit-staff"
                schema={staffFormSchema('edit')}
                data={editForm.data}
                setData={editForm.setData}
                errors={editForm.errors}
                processing={editForm.processing}
                onSubmit={saveEdit}
                primaryColor={primaryColor}
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onClose={() => !deleteBusy && setDeleteTarget(null)}
                title="ຢືນຢັນການລຶບ"
                message={
                    deleteTarget
                        ? `ທ່ານຕ້ອງການລຶບພະນັກງານ “${deleteTarget.name} ${deleteTarget.surname}” (ເບີ ${deleteTarget.phone}) ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
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
