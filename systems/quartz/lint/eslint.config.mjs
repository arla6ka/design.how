import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import tsParser from '@typescript-eslint/parser';

function pluginPath() {
  const here = dirname(fileURLToPath(import.meta.url));
  const dirs = [here, join(here, 'lib/quartz/lint'), join(here, 'src/lib/quartz/lint')];
  try {
    const alias = JSON.parse(readFileSync(join(here, 'components.json'), 'utf8')).aliases?.lib;
    if (alias) dirs.push(...['', 'src'].map(base => join(here, base, alias.replace(/^[@~]\//, ''), 'quartz/lint')));
  } catch {}
  const found = dirs.map(dir => join(dir, 'plugin.mjs')).find(existsSync);
  if (!found) throw new Error('Quartz lint: lib/quartz/lint/plugin.mjs is missing. Run npx shadcn@latest add https://design.how/r/quartz/lint.json');
  return found;
}

const quartz = (await import(pathToFileURL(pluginPath()).href)).default;

export default [
  {ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**', '**/out/**', '**/components/ui/**', '**/lib/quartz/lint/**']},
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {parser: tsParser, parserOptions: {ecmaFeatures: {jsx: true}}},
    linterOptions: {reportUnusedDisableDirectives: 'off'},
    plugins: {quartz},
    processor: 'quartz/standalone',
    rules: quartz.configs.app.rules,
  },
  {files: ['**/components/quartz/{ui,ai}/**', '**/components/quartz/icon.tsx', '**/lib/quartz/**'], rules: quartz.configs.source.rules},
];
