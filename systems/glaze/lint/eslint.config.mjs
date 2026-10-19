import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import tsParser from '@typescript-eslint/parser';

function pluginPath() {
  const here = dirname(fileURLToPath(import.meta.url));
  const dirs = [here, join(here, 'lib/glaze/lint'), join(here, 'src/lib/glaze/lint')];
  try {
    const alias = JSON.parse(readFileSync(join(here, 'components.json'), 'utf8')).aliases?.lib;
    if (alias) dirs.push(...['', 'src'].map(base => join(here, base, alias.replace(/^[@~]\//, ''), 'glaze/lint')));
  } catch {}
  const found = dirs.map(dir => join(dir, 'plugin.mjs')).find(existsSync);
  if (!found) throw new Error('Glaze lint: lib/glaze/lint/plugin.mjs is missing. Run npx shadcn@latest add https://design.how/r/glaze/lint.json');
  return found;
}

const plugin = pluginPath();
const glaze = (await import(pathToFileURL(plugin).href)).default;
const {LINT_IGNORES} = await import(pathToFileURL(join(dirname(plugin), 'value-rules.mjs')).href);

export default [
  {ignores: [...LINT_IGNORES, '**/lib/glaze/lint/**']},
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {parser: tsParser, parserOptions: {ecmaFeatures: {jsx: true}}},
    linterOptions: {reportUnusedDisableDirectives: 'off'},
    plugins: {glaze},
    processor: 'glaze/standalone',
    rules: glaze.configs.app.rules,
  },
  {files: ['**/components/glaze/{ui,ai}/**', '**/components/glaze/icon.tsx', '**/lib/glaze/**'], rules: glaze.configs.source.rules},
];
