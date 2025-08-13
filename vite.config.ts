import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],
  base: '/',
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          motion: ['framer-motion'],
          emotion: ['@emotion/react', '@emotion/styled'],
          leaflet: ['leaflet', 'react-leaflet'],
          firebase: ['firebase'],
          utils: [
            './src/utils/dataLoader',
            './src/utils/dataCache',
            './src/utils/imageOptimizer',
            './src/utils/performanceMonitor',
            './src/utils/serviceWorker'
          ]
        },
        // アセット名の最適化
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      },
    },
    // 圧縮設定（esbuildはデフォルトで高速）
    minify: 'esbuild',
    // チャンクサイズ警告の閾値
    chunkSizeWarningLimit: 1000,
    // ソースマップ（プロダクションでは無効化）
    sourcemap: false
  },
  // 開発サーバー設定
  server: {
    open: true,
    hmr: true
  },
  // 最適化設定
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      'framer-motion',
      'leaflet',
      'react-leaflet'
    ]
  }
})