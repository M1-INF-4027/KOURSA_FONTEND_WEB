import react from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * Le seul defaut que rien d'autre n'attrape.
 *
 * Une balise employee sans etre importee ne se voit qu'a l'execution :
 * no-unused-vars ignore les identifiants JSX, et le build compile sans
 * broncher. C'est ainsi qu'un <Visibility /> sans import a rendu les pages
 * utilisateurs inaccessibles en production.
 *
 * Cette configuration n'existe que pour l'integration continue. Le lint
 * complet (eslint.config.js) compte encore des erreurs heritees — variables
 * inutilisees, exports melanges — dont le traitement demande des remaniements
 * sans rapport ; bloquer les mises en ligne dessus n'aurait aucun sens. Ici
 * on ne bloque que sur ce qui casse le site.
 */
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { react },
    rules: {
      'react/jsx-no-undef': 'error',
    },
  },
])
