import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Standalone SPA build for Vercel (Laravel API hosted separately). */
export default defineConfig({
    plugins: [react()],
    publicDir: 'public',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: `${import.meta.dirname}/index.html`,
        },
    },
});
