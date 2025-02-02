/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../node_modules/.vite/rpc-test',
  plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md']), react({ tsDecorators: true })],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  server: {
    proxy: {
      '/api': 'http://localhost:8000/',
    },
  },
  esbuild: {
    supported: {
      'top-level-await': true,
    },
    exclude: ['@<organisation-kebab>/prisma/index.ts'],
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
    keepNames: true,
    minifyIdentifiers: false,
  },
  build: {
    outDir: '../dist/rpc-test',
    target: 'es2022',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      exclude: ['@<organisation-kebab>/prisma/index.ts'],
    },
    rollupOptions: {
      external: [
        '@<organisation-kebab>/prisma/index.ts',
      ],
    },
  },
  define: {
    'import.meta.vitest': undefined,
  },
});
