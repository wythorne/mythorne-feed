import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Disable CSS code splitting so all CSS goes into one file (deterministic hashing)
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Ensure CSS has content hash in filename
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  publicDir: 'public',
})
