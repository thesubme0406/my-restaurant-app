import ConfirmDialog from '@/Components/MasterData/ConfirmDialog';
import GenericDataTable from '@/Components/MasterData/GenericDataTable';
import GenericFormModal from '@/Components/MasterData/GenericFormModal';
import { router, useForm } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { buildTableColumns } from '@/Pages/Admin/MasterData/columnBuilders';
import { getTableFormFields } from '@/Pages/Admin/MasterData/formSchemas';

// ໂຕະ: ຕາຕະລາງ + ຟອມ + ຢືນຢັນລຶບ
export default function TableManagement({ primaryColor, toolbarClassName, rows }) {
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const tableFormFields = useMemo(() => getTableFormFields(), []);

    const addForm = useForm({
        table_no: '',
        capacity: '4',
        readiness: 'ready',
        zone: 'standard',
    });

    const editForm = useForm({
        table_no: '',
        capacity: '4',
        readiness: 'ready',
        zone: 'standard',
    });

    const openAdd = useCallback(() => {
        addForm.clearErrors();
        addForm.setData({
            table_no: '',
            capacity: '4',
            readiness: 'ready',
            zone: 'standard',
        });
        setAddOpen(true);
    }, [addForm]);

    const openEdit = useCallback(
        (row) => {
            editForm.clearErrors();
            editForm.setData({
                table_no: row.table_no ?? '',
                capacity: row.capacity != null ? String(row.capacity) : '4',
                readiness: row.readiness ?? 'ready',
                zone: row.zone === 'vip' ? 'vip' : 'standard',
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
        addForm.post(route('admin.tables.store'), {
            preserveScroll: true,
            onSuccess: () => setAddOpen(false),
        });
    };

    const saveEdit = (e) => {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.patch(route('admin.tables.update', editing.id), {
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
        router.delete(route('admin.tables.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleteBusy(false);
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget]);

    const columns = useMemo(
        () => buildTableColumns({ onEdit: openEdit, onDelete: askDelete }),
        [openEdit, askDelete]
    );

    return (
        <>
            <GenericDataTable
                title="ຂໍ້ມູນໂຕະ"
                columns={columns}
                rows={rows}
                searchKeys={['table_no', 'zone', 'readiness', 'usage_status']}
                searchPlaceholder="ຄົ້ນຫາ…"
                totalCount={rows.length}
                totalLabel="ທັງໝົດ"
                countSuffix="ໂຕະ"
                emptyMessage="ຍັງບໍ່ມີຂໍ້ມູນໂຕະ"
                onAdd={openAdd}
                addButtonLabel="ເພີ່ມຂໍ້ມູນໂຕະ"
                primaryColor={primaryColor}
                toolbarClassName={toolbarClassName}
            />

            <GenericFormModal
                open={addOpen}
                onClose={() => !addForm.processing && setAddOpen(false)}
                title="ເພີ່ມຂໍ້ມູນໂຕະ"
                submitLabel="ບັນທຶກຂໍ້ມູນໂຕະ"
                formId="master-add-table"
                schema={tableFormFields}
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
                title="ແກ້ໄຂຂໍ້ມູນໂຕະ"
                submitLabel="ບັນທຶກຂໍ້ມູນໂຕະ"
                formId="master-edit-table"
                schema={tableFormFields}
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
                        ? `ທ່ານຕ້ອງການລຶບໂຕະ “${deleteTarget.table_no}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
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
