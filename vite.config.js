import { defineConfig } from 'vite'

export default defineConfig({
    base: '/hoop-dreams/',
    build: {
        outDir: 'dist'
    },
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.js'
    }
})
