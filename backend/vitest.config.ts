import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // Les tests d'intégration (infrastructure/, use-cases/*.integration.spec)
    // partagent la même base Postgres. Exécution des fichiers en séquence
    // pour éviter qu'un beforeEach vide les tables pendant qu'un autre
    // fichier est en train d'y écrire. À revoir si la suite de tests devient
    // trop lente (bases isolées par worker, ou schémas Postgres séparés).
    fileParallelism: false,
  },
});