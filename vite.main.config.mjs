import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      // This tells Vite to skip bundling the C++ engine
      external: ['node-llama-cpp'],
    },
  },
});