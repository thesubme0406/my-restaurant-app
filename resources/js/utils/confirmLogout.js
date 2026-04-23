import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';

/** ຢືນຢັນກ່ອນອອກຈາກລະບົບ */
export function confirmAndLogout() {
    Swal.fire({
        title: 'ອອກຈາກລະບົບ?',
        text: 'ທ່ານຕ້ອງການອອກຈາກບັນຊີນີ້ແທ້ບໍ?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#194c9f',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ອອກຈາກລະບົບ',
        cancelButtonText: 'ຍົກເລີກ',
        reverseButtons: true,
        customClass: { popup: 'font-sans text-sm' },
    }).then((result) => {
        if (result.isConfirmed) {
            router.post(route('logout'));
        }
    });
}
