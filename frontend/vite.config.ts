import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            '/api': {
                target: 'https://localhost:3001',
                changeOrigin: true,
                secure: false, // Allow self-signed certs
            },
            '/socket.io': {
                target: 'https://localhost:3001',
                changeOrigin: true,
                secure: false, // Allow self-signed certs
                ws: true,
            },
        },
    },
})
