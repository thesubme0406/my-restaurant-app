import ConfirmDialog from '@/Components/MasterData/ConfirmDialog';
import GenericDataTable from '@/Components/MasterData/GenericDataTable';
import GenericFormModal from '@/Components/MasterData/GenericFormModal';
import { router, useForm } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { buildSupplierColumns } from '@/Pages/Admin/MasterData/columnBuilders';
import { supplierFormSchema } from '@/Pages/Admin/MasterData/formSchemas';

// ຜູ້ສະໜອງ: ຕາຕະລາງ + ຟອມ + ຢືນຢັນລຶບ
export default function SupplierManagement({ primaryColor, toolbarClassName, rows }) {
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const addForm = useForm({
        sup_name: '',
        contact_tel: '',
        contact_person: '',
        sup_address: '',
    });

    const editForm = useForm({
        sup_name: '',
        contact_tel: '',
        contact_person: '',
        sup_address: '',
    });

    const openAdd = useCallback(() => {
        addForm.clearErrors();
        addForm.setData({
            sup_name: '',
            contact_tel: '',
            contact_person: '',
            sup_address: '',
        });
        setAddOpen(true);
    }, [addForm]);

    const openEdit = useCallback(
        (row) => {
            editForm.clearErrors();
            editForm.setData({
                sup_name: row.sup_name ?? '',
                contact_tel: row.contact_tel ?? '',
                contact_person: row.contact_person ?? '',
                sup_address: row.sup_address ?? '',
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
        addForm.post(route('admin.suppliers.store'), {
            preserveScroll: true,
            onSuccess: () => setAddOpen(false),
        });
    };

    const saveEdit = (e) => {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.patch(route('admin.suppliers.update', editing.id), {
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
        router.delete(route('admin.suppliers.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleteBusy(false);
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget]);

    const columns = useMemo(
        () => buildSupplierColumns({ onEdit: openEdit, onDelete: askDelete }),
        [openEdit, askDelete]
    );

    return (
        <>
            <GenericDataTable
                title="ຂໍ້ມູນຜູ້ສະໜອງ"
                columns={columns}
                rows={rows}
                searchKeys={['sup_name', 'contact_person']}
                searchPlaceholder="ຄົ້ນຫາຜູ້ສະໜອງ…"
                totalCount={rows.length}
                totalLabel="ທັງໝົດ"
                countSuffix="ລາຍການ"
                emptyMessage="ຍັງບໍ່ມີຜູ້ສະໜອງ"
                onAdd={openAdd}
                addButtonLabel="ເພີ່ມຂໍ້ມູນຜູ້ສະໜອງ"
                primaryColor={primaryColor}
                toolbarClassName={toolbarClassName}
            />

            <GenericFormModal
                open={addOpen}
                onClose={() => !addForm.processing && setAddOpen(false)}
                title="ເພີ່ມຂໍ້ມູນຜູ້ສະໜອງ"
                submitLabel="ບັນທຶກຂໍ້ມູນຜູ້ສະໜອງ"
                formId="master-add-supplier"
                schema={supplierFormSchema}
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
                title="ແກ້ໄຂຂໍ້ມູນຜູ້ສະໜອງ"
                submitLabel="ບັນທຶກຂໍ້ມູນຜູ້ສະໜອງ"
                formId="master-edit-supplier"
                schema={supplierFormSchema}
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
                        ? `ທ່ານຕ້ອງການລຶບຜູ້ສະໜອງ “${deleteTarget.sup_name}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
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
