import { defineConfig } from 'vite';
import path, { resolve } from 'path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import fs from 'fs';

console.log(path.join(import.meta.url, '../build'));
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
      rollupTypes: true,
    }),
    {
      name: 'generate-deno-index',
      writeBundle() {
        const content = '// @deno-types="./index.d.ts"\nexport * from \'./index.js\';\n';
        fs.writeFileSync(resolve(__dirname, 'build/index.ts'), content);
      },
    },
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
    },
    target: 'ES2022',
    rollupOptions: {
      external: ['react', 'react/jsx-runtime'],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});