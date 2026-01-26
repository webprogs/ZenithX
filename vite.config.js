import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/main.tsx'],
            refresh: true,
        }),
        tailwindcss(),
        react(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // React core libraries
                        if (id.includes('react-dom') || id.includes('/react/')) {
                            return 'react-vendor';
                        }
                        // React Router
                        if (id.includes('react-router') || id.includes('@remix-run')) {
                            return 'router';
                        }
                        // Form handling libraries
                        if (id.includes('react-hook-form') || id.includes('hookform') || id.includes('zod')) {
                            return 'forms';
                        }
                        // HTTP client
                        if (id.includes('axios')) {
                            return 'http';
                        }
                        // Heroicons
                        if (id.includes('@heroicons')) {
                            return 'icons';
                        }
                        // Other vendor libs
                        if (id.includes('react-hot-toast') || id.includes('clsx')) {
                            return 'ui-utils';
                        }
                    }
                },
            },
        },
    },
});
