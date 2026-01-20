import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/Year2026/', // ADD THIS LINE (must match your repo name)
})