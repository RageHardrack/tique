import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import ui from '@nuxt/ui/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      autoImport: {
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/auto-imports.d.ts',
        eslintrc: { enabled: true }
      },
      components: {
        dirs: ['src/presentation/components/base'],
        dts: 'src/components.d.ts'
      }
    }),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Tique — Fortuna & Finanzas Personales',
        short_name: 'Tique',
        description:
          'Plataforma de finanzas personales, gestión patrimonial y multimoneda.',
        theme_color: '#0f1523',
        background_color: '#0f1523',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        shortcuts: [
          {
            name: 'Nuevo Gasto',
            short_name: 'Gasto',
            description: 'Registrar un gasto rápido en Tique',
            url: '/movimientos?quick=expense',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Nuevo Ingreso',
            short_name: 'Ingreso',
            description: 'Registrar un ingreso en Tique',
            url: '/movimientos?quick=income',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts']
  }
})
