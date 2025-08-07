import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  resolve: {
        alias: {
            // Aquí definimos todos nuestros alias
            $lib: path.resolve('./src/lib'),
            $components: path.resolve('./src/lib/components'),
            $routes: path.resolve('./src/lib/routes'),
            $server: path.resolve('./src/lib/server'), // Alias que vi en tu código
        },
    }
})
