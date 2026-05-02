/**
 * ສີ ແລະ ພື້ນຫຼັງຕົວແບບ Oshinei Navy — ຄ່າກົງກັບ tailwind.config.js (oshinei-*) ແລະ resources/css/app.css (--oshinei-*).
 * ໃຊ້ຫຼຸດການຊ້ຳຂໍ້ຄວາມ hex ຍາວໃນ inline style.
 */
export const oshineiInline = {
    heroBackdrop: {
        background:
            'linear-gradient(180deg, rgba(25,76,159,0.08) 0%, rgba(25,76,159,0.02) 50%, rgba(25,76,159,0.08) 100%)',
    },
    sushiPattern: {
        backgroundImage: "url('/images/sushi.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: '190px',
        backgroundPosition: 'center',
    },
    heroDots: {
        backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(25,76,159,0.18) 0, rgba(25,76,159,0.18) 2px, transparent 2px), radial-gradient(circle at 84% 82%, rgba(25,76,159,0.14) 0, rgba(25,76,159,0.14) 2px, transparent 2px)",
        backgroundSize: '34px 34px, 38px 38px',
    },
    menuSectionGrid: {
        backgroundImage:
            "linear-gradient(135deg, rgba(25,76,159,0.12) 0, rgba(25,76,159,0.12) 1px, transparent 1px, transparent 18px)",
        backgroundSize: '18px 18px',
    },
    promoDots: {
        backgroundImage:
            "radial-gradient(circle at 8px 8px, rgba(25,76,159,0.2) 1.2px, transparent 1.2px)",
        backgroundSize: '20px 20px',
    },
    bookingStripes: {
        backgroundImage:
            "repeating-linear-gradient(-35deg, rgba(25,76,159,0.16) 0, rgba(25,76,159,0.16) 1px, transparent 1px, transparent 14px)",
    },
};

/** ກົດ hover ປຸ່ມຈອງຄິວ / ປຸ່ມນຳເຂົ້າບຸບເຟ່ — ຄືກັນທຸກຈຸດເພື່ອບໍ່ຊ້ຳກົນກົດແອນິເມຊັນ. */
export const oshineiCtaPressable = 'transition hover:-translate-y-0.5 hover:brightness-105';
