import ConfirmDialog from '@/Components/MasterData/ConfirmDialog';
import GenericDataTable from '@/Components/MasterData/GenericDataTable';
import GenericFormModal from '@/Components/MasterData/GenericFormModal';
import { router, useForm } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { buildNewsColumns } from '@/Pages/Admin/MasterData/columnBuilders';
import { buildNewsFormSchema } from '@/Pages/Admin/MasterData/formSchemas';

// ຂ່າວ: ຕາຕະລາງ + ຟອມ + ຢືນຢັນລຶບ
export default function PromotionManagement({ primaryColor, toolbarClassName, rows, staffOptions }) {
    const newsFields = useMemo(() => buildNewsFormSchema(staffOptions ?? []), [staffOptions]);

    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const addForm = useForm({
        image: null,
        image_url: '',
        title: '',
        content: '',
        staff_id: '',
        status: 'draft',
    });

    const editForm = useForm({
        image: null,
        image_url: '',
        title: '',
        content: '',
        staff_id: '',
        status: 'draft',
    });

    const openAdd = useCallback(() => {
        addForm.clearErrors();
        const opts = staffOptions ?? [];
        addForm.setData({
            image: null,
            image_url: '',
            title: '',
            content: '',
            staff_id: opts[0]?.id ? String(opts[0].id) : '',
            status: 'draft',
        });
        setAddOpen(true);
    }, [addForm, staffOptions]);

    const openEdit = useCallback(
        (row) => {
            editForm.clearErrors();
            editForm.setData({
                image: null,
                image_url: row.image_url ?? '',
                title: row.title ?? '',
                content: row.content ?? '',
                staff_id: row.staff_id != null ? String(row.staff_id) : '',
                status: row.status ?? 'draft',
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
        addForm.post(route('admin.news.store'), {
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
        editForm.post(route('admin.news.update', editing.id), {
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
        router.delete(route('admin.news.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleteBusy(false);
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget]);

    const columns = useMemo(
        () => buildNewsColumns({ onEdit: openEdit, onDelete: askDelete }),
        [openEdit, askDelete]
    );

    return (
        <>
            <GenericDataTable
                title="ຂໍ້ມູນຂ່າວສານ"
                columns={columns}
                rows={rows}
                searchKeys={['title']}
                searchPlaceholder="ຄົ້ນຫາຫົວຂໍ້ຂ່າວ…"
                totalCount={rows.length}
                totalLabel="ທັງໝົດ"
                countSuffix="ຂ່າວ"
                emptyMessage="ຍັງບໍ່ມີຂ່າວສານ"
                onAdd={openAdd}
                addButtonLabel="ເພີ່ມຂ່າວສານ"
                primaryColor={primaryColor}
                toolbarClassName={toolbarClassName}
            />

            <GenericFormModal
                open={addOpen}
                onClose={() => !addForm.processing && setAddOpen(false)}
                title="ເພີ່ມຂ່າວສານ"
                submitLabel="ບັນທຶກຂ່າວສານ"
                formId="master-add-news"
                schema={newsFields('add')}
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
                title="ແກ້ໄຂຂໍ້ມູນຂ່າວສານ"
                submitLabel="ບັນທຶກຂ່າວສານ"
                formId="master-edit-news"
                schema={newsFields('edit')}
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
                        ? `ທ່ານຕ້ອງການລຶບຂ່າວ “${deleteTarget.title}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
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
