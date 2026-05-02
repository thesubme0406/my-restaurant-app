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
            colors: {
                oshinei: {
                    navy: '#194c9f',
                    'navy-dark': '#153d82',
                    'cta-from': '#2a63bb',
                    'cta-to': '#174896',
                    'cta-strong-from': '#2457ac',
                    'cta-strong-to': '#123a80',
                    ice: '#7dc6ff',
                },
            },
        },
    },

    plugins: [forms],
};
