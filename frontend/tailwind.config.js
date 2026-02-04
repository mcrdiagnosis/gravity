/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'gravity-dark': '#0f172a',
                'gravity-accent': '#6366f1',
            }
        },
    },
    plugins: [],
}
