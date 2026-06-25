import { defineConfig } from 'vite';

export default defineConfig({
  // If you have a plugins array (like plugins: [react()]), keep it here!
  build: {
    rollupOptions: {
      external: ['node-llama-cpp'],
    },
  },
});