import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['"Noto Sans Lao"', ...defaultTheme.fontFamily.sans],
                lao: [
                    '"Noto Sans Lao"',
                    'Phetsarath OT',
                    'Figtree',
                    ...defaultTheme.fontFamily.sans,
                ],
            },
        },
    },

    plugins: [forms],
};
