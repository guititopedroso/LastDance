import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Evita que o Vite resolva a pasta para o caminho virtualizado do Windows (AppData)
  resolve: { preserveSymlinks: true },
})
