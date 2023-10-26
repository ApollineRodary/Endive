import { defineConfig } from 'vite'
import path from 'path'

export default {
  root: path.resolve(__dirname, 'src'),

  build: {
    outDir: path.resolve(__dirname, 'dist'),
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'src/main.ts')
      },
      output: {
        entryFileNames: `editor.js`,
        chunkFileNames: `editor.js`,
        assetFileNames: `editor.[ext]`
      }, 
    }
  }
}
