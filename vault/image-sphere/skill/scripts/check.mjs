#!/usr/bin/env node
// Checks a visual's source against the performance contract in references/perf.md.
//   node scripts/check.mjs <folder or files>...
// Prints one line per problem and exits 1, or prints "ok" and exits 0. Needs Node 18 or later, no packages.
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';

const GL_CODE = /getContext\(\s*['"`](webgl2?|experimental-webgl)['"`]|from\s+['"](three|ogl)['"]|new\s+(THREE\.)?WebGLRenderer\b/;
const CANVAS_CODE = /getContext\(\s*['"`](2d|webgl2?|experimental-webgl|bitmaprenderer)['"`]|from\s+['"](three|ogl)['"]/;

/** The number a name is bound to in any of the files (`const NAME = 1.5`), or NaN. */
function constant(files, name) {
  for (const {text} of files) {
    const m = text.match(new RegExp(`\\b(?:const|let|var)\\s+${name}\\s*(?::\\s*number\\s*)?=\\s*(\\d*\\.?\\d+)`));
    if (m) return Number(m[1]);
  }
  return NaN;
}

/** The arguments of the first Math.min( call on a line that mentions devicePixelRatio, split at top-level commas. */
function minArgs(line) {
  for (let at = line.indexOf('Math.min('); at >= 0; at = line.indexOf('Math.min(', at + 1)) {
    let depth = 0;
    const args = [''];
    for (let i = at + 'Math.min('.length; i < line.length; i++) {
      const ch = line[i];
      if (ch === '(') depth++;
      if (ch === ')' && depth-- === 0) break;
      if (ch === ',' && depth === 0) args.push('');
      else args[args.length - 1] += ch;
    }
    if (args.some(arg => /devicePixelRatio/.test(arg))) return args.map(arg => arg.trim());
  }
  return null;
}

/** The value a cap argument stands for: a number, a constant's number, or the smallest of a nested Math.min. */
function capValue(files, arg) {
  if (/^\d*\.?\d+$/.test(arg)) return Number(arg);
  if (/^[\w.]+$/.test(arg)) return constant(files, arg.replace(/^(this|[A-Z_]+)\./, ''));
  const nested = arg.match(/^Math\.min\((.*)\)$/);
  if (nested) return Math.min(...nested[1].split(',').map(part => capValue(files, part.trim())).filter(v => !Number.isNaN(v)));
  return NaN;
}

/** Every devicePixelRatio read that is not capped at 2 or less, as "file:line". */
function uncappedDpr(files) {
  const out = [];
  for (const {path, text} of files) {
    text.split('\n').forEach((line, i) => {
      if (!/devicePixelRatio/.test(line) || /^\s*(\/\/|\*)/.test(line)) return;
      const args = minArgs(line);
      const caps = args?.filter(arg => !/devicePixelRatio/.test(arg)).map(arg => capValue(files, arg)) ?? [];
      if (!caps.some(value => value <= 2)) out.push(`${path}:${i + 1}`);
    });
  }
  return out;
}

/**
 * The contract's failures for one visual, each a sentence that says what to add.
 * @param {{path: string, text: string}[]} files the visual's source files
 * @param {{name?: string, gl?: boolean}} [options] gl: the registry says it holds a WebGL context
 * @returns {string[]}
 */
function checkVisual(files, {name = 'visual', gl} = {}) {
  const code = files.map(f => f.text).join('\n');
  const usesGl = GL_CODE.test(code);
  const usesCanvas = CANVAS_CODE.test(code);
  const errors = [];
  const fail = message => errors.push(`${name}: ${message}`);

  if (gl !== undefined && usesGl !== gl) {
    fail(usesGl
      ? 'creates a WebGL context but its tech is not a GL tech, so the six-context budget never sees it. Set tech to webgl, webgl2, three or ogl.'
      : 'is registered with a GL tech but creates no WebGL context. Set its tech to what it draws with.');
  }

  if (usesCanvas) {
    const bad = uncappedDpr(files);
    if (bad.length) fail(`reads devicePixelRatio without a cap of 2 or less at ${bad.join(', ')}. Use capDpr() or Math.min(window.devicePixelRatio || 1, 2).`);
    if (!/devicePixelRatio|capDpr\(/.test(code)) fail('sizes a canvas without reading the pixel ratio. Size the backing store at capDpr() (at most 2) times its CSS size.');
  }

  if (!/usePause\(|IntersectionObserver/.test(code)) fail('never pauses off screen. Stop the loop when the element leaves the viewport: usePause(), or an IntersectionObserver that calls stop().');
  if (!/usePause\(|visibilitychange/.test(code)) fail('never pauses on a hidden tab. Stop the loop on visibilitychange when document.hidden: usePause() does both.');
  if (!/prefersReducedMotion\(|prefers-reduced-motion/.test(code)) fail('ignores reduced motion. Read prefers-reduced-motion and draw one still frame instead of running.');
  else if (usesCanvas && !/renderStill\(/.test(code)) fail('has no reduced-motion still. Give the engine a renderStill() that draws one frame, and call it instead of start() under reduced motion.');
  if (!/\.(destroy|dispose)\(\s*\)/.test(code)) fail('is never disposed. Give the engine destroy() (stop the loop, remove listeners, free what it made) and call it in the effect cleanup.');

  if (usesGl) {
    if (!/loseContext\(|disposeGl\(|forceContextLoss\(/.test(code)) fail('keeps its WebGL context after destroy. Call gl.getExtension("WEBGL_lose_context")?.loseContext() (or disposeGl(), or renderer.forceContextLoss() for three) in destroy().');
    if (!/webglcontextlost|watchContextLoss\(/.test(code)) fail('does not handle a lost context. Listen for webglcontextlost on the canvas and stop the loop there (watchContextLoss()).');
  }
  return errors;
}

const walk = path => statSync(path).isDirectory()
  ? readdirSync(path).filter(name => name !== 'node_modules' && !name.startsWith('.')).flatMap(name => walk(join(path, name)))
  : [path];
const paths = process.argv.slice(2);
if (!paths.length) {
  console.error('usage: node scripts/check.mjs <folder or files>...');
  process.exit(2);
}
const files = paths.flatMap(walk).filter(path => /\.(m?[jt]sx?)$/.test(path)).map(path => ({path, text: readFileSync(path, 'utf8')}));
const errors = checkVisual(files);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`ok: ${files.length} files keep the contract`);
