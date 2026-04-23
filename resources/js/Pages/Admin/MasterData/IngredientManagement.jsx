import ConfirmDialog from '@/Components/MasterData/ConfirmDialog';
import GenericDataTable from '@/Components/MasterData/GenericDataTable';
import GenericFormModal from '@/Components/MasterData/GenericFormModal';
import { router, useForm } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { buildIngredientColumns } from '@/Pages/Admin/MasterData/columnBuilders';
import { ingredientFormSchema } from '@/Pages/Admin/MasterData/formSchemas';

// ວັດຖຸດິບ: ຕາຕະລາງ + ຟອມ + ຢືນຢັນລຶບ
export default function IngredientManagement({ primaryColor, toolbarClassName, rows }) {
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const addForm = useForm({
        ing_name: '',
        ing_unit: 'kg',
        ing_quantity: '',
        ing_min: '',
    });

    const editForm = useForm({
        ing_name: '',
        ing_unit: 'kg',
        ing_quantity: '',
        ing_min: '',
    });

    const openAdd = useCallback(() => {
        addForm.clearErrors();
        addForm.setData({
            ing_name: '',
            ing_unit: 'kg',
            ing_quantity: '',
            ing_min: '',
        });
        setAddOpen(true);
    }, [addForm]);

    const openEdit = useCallback(
        (row) => {
            editForm.clearErrors();
            editForm.setData({
                ing_name: row.ing_name ?? '',
                ing_unit: row.ing_unit ?? 'kg',
                ing_quantity: row.ing_quantity != null ? String(row.ing_quantity) : '',
                ing_min: row.ing_min != null ? String(row.ing_min) : '',
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
        addForm.post(route('admin.ingredients.store'), {
            preserveScroll: true,
            onSuccess: () => setAddOpen(false),
        });
    };

    const saveEdit = (e) => {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.patch(route('admin.ingredients.update', editing.id), {
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
        router.delete(route('admin.ingredients.destroy', id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleteBusy(false);
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget]);

    const columns = useMemo(
        () => buildIngredientColumns({ onEdit: openEdit, onDelete: askDelete }),
        [openEdit, askDelete]
    );

    return (
        <>
            <GenericDataTable
                title="ຂໍ້ມູນວັດຖຸດິບ"
                columns={columns}
                rows={rows}
                searchKeys={['ing_name']}
                searchPlaceholder="ຄົ້ນຫາວັດຖຸດິບ…"
                totalCount={rows.length}
                totalLabel="ທັງໝົດ"
                countSuffix="ລາຍການ"
                emptyMessage="ຍັງບໍ່ມີວັດຖຸດິບ"
                onAdd={openAdd}
                addButtonLabel="ເພີ່ມຂໍ້ມູນວັດຖຸດິບ"
                primaryColor={primaryColor}
                toolbarClassName={toolbarClassName}
            />

            <GenericFormModal
                open={addOpen}
                onClose={() => !addForm.processing && setAddOpen(false)}
                title="ເພີ່ມຂໍ້ມູນວັດຖຸດິບ"
                submitLabel="ບັນທຶກຂໍ້ມູນວັດຖຸດິບ"
                formId="master-add-ingredient"
                schema={ingredientFormSchema}
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
                title="ແກ້ໄຂຂໍ້ມູນວັດຖຸດິບ"
                submitLabel="ບັນທຶກຂໍ້ມູນວັດຖຸດິບ"
                formId="master-edit-ingredient"
                schema={ingredientFormSchema}
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
                        ? `ທ່ານຕ້ອງການລຶບວັດຖຸດິບ “${deleteTarget.ing_name}” ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
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
