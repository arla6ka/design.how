#!/usr/bin/env node
// legacy.mjs: the legacy inventory and its ratchet. Node 18+, no dependencies.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const KINDS = ["import", "raw", "palette"];

const HELP = `legacy.mjs [--inventory | --record] [--root <dir>] [--config <file>] [--baseline <file>] [--paths "<glob> ..."]
legacy.mjs --init-config | --self-test | --help

Counts legacy usage per file and kind (${KINDS.join(", ")}), as occurrences, and holds the count to a committed baseline.
  (no flag)     fail when a count rose, a file with findings is not in the baseline, a count fell without being
                recorded (run --record to lock the win in), or a file imports the system and a legacy module together
  --inventory   print kind, file, count, then totals. Changes nothing. Audit mode uses this
  --record      rewrite the baseline from today's counts, sorted. Never run it over other workers' half-done edits
  --paths       scoped check: compare only files matching the globs. Cannot be combined with --record
  --init-config write a starter config. Refuses to overwrite

Config, default <root>/.design-system/legacy.json
  {"scan": ["src"], "ignore": ["**/*.test.*"], "tokenFiles": ["src/tokens.css"],
   "legacyImports": ["^@old/ui", "/legacy/"], "systemImports": ["^@sys/ui"]}
  legacyImports and systemImports are regexes over import specifiers. tokenFiles may hold raw values.
Baseline, default <root>/.design-system/legacy-baseline.json: {"path/file.tsx": {"raw": 2, "import": 1}}
Exit  0 pass  1 violations  2 usage or missing baseline`;

const globRe = (g) => {
	let re = "";
	for (let i = 0; i < g.length; i++) {
		const c = g[i];
		if (c === "*" && g[i + 1] === "*") { i++; if (g[i + 1] === "/") { i++; re += "(?:.*/)?"; } else re += ".*"; }
		else if (c === "*") re += "[^/]*";
		else if (c === "?") re += "[^/]";
		else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
	}
	return new RegExp(`^${re}$`);
};

const EXT = /\.(tsx?|jsx?|mjs|css|scss|vue|svelte|astro|html)$/;
const SKIP_DIR = new Set(["node_modules", ".git", "dist", "build", ".next", ".turbo", "coverage", ".design-system"]);
const RAW_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/g;
const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PALETTE_RE = new RegExp(`\\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|decoration|shadow|accent|caret)-(?:${PALETTE})-\\d{2,3}\\b|var\\(--color-(?:${PALETTE})-\\d+\\)`, "g");
const SPEC_RE = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;

function walk(root, dirs) {
	const out = [];
	const rec = (d) => {
		for (const name of readdirSync(d)) {
			if (SKIP_DIR.has(name)) continue;
			const p = join(d, name);
			const s = statSync(p);
			if (s.isDirectory()) rec(p);
			else if (EXT.test(name)) out.push(relative(root, p).split("\\").join("/"));
		}
	};
	for (const d of dirs) if (existsSync(join(root, d))) rec(join(root, d));
	return out;
}

export function scan(root, cfg) {
	const ignore = (cfg.ignore || []).map(globRe);
	const tokens = new Set(cfg.tokenFiles || []);
	const legacy = (cfg.legacyImports || []).map((r) => new RegExp(r));
	const system = (cfg.systemImports || []).map((r) => new RegExp(r));
	const counts = {};
	const mixed = [];
	for (const file of walk(root, cfg.scan || ["src"])) {
		if (ignore.some((re) => re.test(file))) continue;
		const text = readFileSync(join(root, file), "utf8");
		const c = {};
		let usesSystem = false;
		for (const m of text.matchAll(SPEC_RE)) {
			if (legacy.some((re) => re.test(m[1]))) c.import = (c.import || 0) + 1;
			if (system.some((re) => re.test(m[1]))) usesSystem = true;
		}
		if (!tokens.has(file)) {
			const raw = (text.match(RAW_RE) || []).length;
			if (raw) c.raw = raw;
		}
		const pal = (text.match(PALETTE_RE) || []).length;
		if (pal) c.palette = pal;
		if (Object.keys(c).length) counts[file] = c;
		if (usesSystem && c.import) mixed.push(file);
	}
	return { counts, mixed };
}

export function compare(baseline, current, inScope = () => true) {
	const rose = [];
	const stale = [];
	for (const file of new Set([...Object.keys(baseline), ...Object.keys(current)])) {
		if (!inScope(file)) continue;
		for (const kind of KINDS) {
			const before = baseline[file]?.[kind] ?? 0;
			const after = current[file]?.[kind] ?? 0;
			if (after === before) continue;
			const note = !baseline[file] ? " (not in baseline)" : !current[file] ? " (no findings now)" : "";
			(after > before ? rose : stale).push(`  ${file}  ${kind}  baseline ${before}, now ${after}${note}`);
		}
	}
	return { rose, stale };
}

const total = (counts, kind) => Object.values(counts).reduce((s, c) => s + (c[kind] || 0), 0);
const summary = (counts) => `${Object.keys(counts).length} files with findings; ${KINDS.map((k) => `${k} ${total(counts, k)}`).join(", ")} (occurrences).`;
const sorted = (counts) => Object.fromEntries(Object.keys(counts).sort().map((f) => [f, Object.fromEntries(KINDS.filter((k) => counts[f][k]).map((k) => [k, counts[f][k]]))]));
const baselineText = (counts) => "{\n" + Object.entries(sorted(counts)).map(([f, c]) => `\t${JSON.stringify(f)}: ${JSON.stringify(c)}`).join(",\n") + "\n}\n";

function main(argv) {
	const o = { paths: null };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (["--root", "--config", "--baseline", "--paths"].includes(a) && i + 1 < argv.length) o[a.slice(2)] = argv[++i];
		else if (["--inventory", "--record", "--init-config", "--help", "--self-test"].includes(a)) o[a.slice(2)] = true;
		else { console.error(HELP); return 2; }
	}
	if (o.help) { console.log(HELP); return 0; }
	if (o["self-test"]) return selfTest();
	const root = resolve(o.root || process.cwd());
	const cfgFile = resolve(o.config || join(root, ".design-system/legacy.json"));
	const baseFile = resolve(o.baseline || join(root, ".design-system/legacy-baseline.json"));
	if (o["init-config"]) {
		if (existsSync(cfgFile)) { console.error(`${cfgFile} exists`); return 2; }
		mkdirSync(dirname(cfgFile), { recursive: true });
		writeFileSync(cfgFile, JSON.stringify({ scan: ["src"], ignore: ["**/*.test.*", "**/*.stories.*"], tokenFiles: [], legacyImports: ["^@old/ui"], systemImports: ["^@sys/ui"] }, null, "\t") + "\n");
		console.log(`wrote ${cfgFile}. Set legacyImports and systemImports to your modules`);
		return 0;
	}
	if (!existsSync(cfgFile)) { console.error(`no config at ${cfgFile}. Run --init-config`); return 2; }
	const { counts, mixed } = scan(root, JSON.parse(readFileSync(cfgFile, "utf8")));
	if (o.inventory) {
		for (const f of Object.keys(counts).sort()) for (const k of KINDS) if (counts[f][k]) console.log(`${k}\t${f}\t${counts[f][k]}`);
		for (const f of mixed.sort()) console.log(`mixed\t${f}\t1`);
		console.log(summary(counts));
		return 0;
	}
	if (o.record) {
		if (o.paths) { console.error("--paths is read-only"); return 2; }
		mkdirSync(dirname(baseFile), { recursive: true });
		writeFileSync(baseFile, baselineText(counts));
		console.log(`recorded ${baseFile}: ${summary(counts)}`);
		return 0;
	}
	if (!existsSync(baseFile)) { console.error(`${baseFile} is missing. Create it with --record`); return 2; }
	const scope = o.paths ? o.paths.split(/\s+/).filter(Boolean).map(globRe) : null;
	const inScope = (f) => !scope || scope.some((re) => re.test(f));
	const { rose, stale } = compare(JSON.parse(readFileSync(baseFile, "utf8")), counts, inScope);
	const mixedHere = mixed.filter(inScope);
	if (rose.length) console.log(`New legacy usage (${rose.length}). Use the system instead:\n${rose.sort().join("\n")}`);
	if (stale.length) console.log(`Stale baseline, run --record to lock in the fall (${stale.length}):\n${stale.sort().join("\n")}`);
	if (mixedHere.length) console.log(`Files that import the system and a legacy module together (${mixedHere.length}):\n${mixedHere.sort().map((f) => "  " + f).join("\n")}`);
	console.log(summary(counts));
	return rose.length + stale.length + mixedHere.length ? 1 : 0;
}

// ---------------------------------------------------------------- self-test
function selfTest() {
	let fails = 0;
	const expect = (name, ok, detail = "") => { console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : "\n" + detail}`); if (!ok) fails++; };
	const dir = mkdtempSync(join(tmpdir(), "legacy-"));
	const w = (f, t) => { mkdirSync(dirname(join(dir, f)), { recursive: true }); writeFileSync(join(dir, f), t); };
	w(".design-system/legacy.json", JSON.stringify({ scan: ["src"], ignore: ["**/*.test.*"], tokenFiles: ["src/tokens.css"], legacyImports: ["^@old/ui"], systemImports: ["^@sys/ui"] }));
	w("src/tokens.css", ":root { --a: #0a0a0a; }\n");
	w("src/a.tsx", 'import { Modal } from "@old/ui"\nexport const A = () => <p style={{ color: "#333" }} className="text-gray-500" />\n');
	w("src/b.tsx", 'import { Card } from "@sys/ui"\nexport const B = () => <Card />\n');
	w("src/c.test.tsx", 'const x = "#fff"\n');
	const run = (...a) => spawnSync(process.execPath, [SELF, "--root", dir, ...a], { encoding: "utf8" });
	let r = run("--inventory");
	expect("inventory counts import, raw and palette once", /import\tsrc\/a.tsx\t1/.test(r.stdout) && /raw\tsrc\/a.tsx\t1/.test(r.stdout) && /palette\tsrc\/a.tsx\t1/.test(r.stdout), r.stdout);
	expect("tokenFiles and ignored tests are not counted", !/tokens.css|c.test/.test(r.stdout), r.stdout);
	expect("a missing baseline exits 2", run().status === 2);
	expect("--record exits 0", run("--record").status === 0);
	expect("a clean tree passes", run().status === 0, run().stdout);
	const plant = (name, file, text, want) => {
		const path = join(dir, file);
		const saved = existsSync(path) ? readFileSync(path, "utf8") : null;
		w(file, text(saved || ""));
		const bad = run();
		expect(`plant: ${name} fails`, bad.status === 1 && bad.stdout.includes(want), bad.stdout);
		if (saved === null) rmSync(path); else writeFileSync(path, saved);
		expect(`reverted ${name} passes`, run().status === 0, run().stdout);
	};
	plant("a raw colour in a listed file", "src/a.tsx", (t) => t + 'const y = "#abcdef"\n', "raw");
	plant("a palette class", "src/b.tsx", (t) => t + 'const z = "bg-red-500"\n', "palette");
	plant("a legacy import", "src/b.tsx", (t) => 'import { X } from "@old/ui"\n' + t, "import");
	plant("a new unlisted file with a finding", "src/new.tsx", () => 'export const N = () => <b style={{ color: "#fff" }} />\n', "not in baseline");
	plant("a file importing the system and a legacy module", "src/mix.tsx", () => 'import { Card } from "@sys/ui"\nimport { M } from "@old/ui"\n', "together");
	w("src/a.tsx", 'import { Card } from "@sys/ui"\nexport const A = Card\n');
	r = run();
	expect("a fall the baseline does not record fails", r.status === 1 && /Stale baseline/.test(r.stdout), r.stdout);
	run("--record");
	expect("after --record the win is locked in", run().status === 0);
	w("src/a.tsx", 'import { Card } from "@sys/ui"\nconst c = "#123456"\nexport const A = Card\n');
	expect("putting a finding back fails as a rise", run().status === 1);
	w("src/a.tsx", 'import { Card } from "@sys/ui"\nexport const A = Card\n');
	w("src/other.tsx", 'const o = "#eeeeee"\n');
	expect("--paths passes when the violation is elsewhere", run("--paths", "src/a.tsx").status === 0);
	expect("--paths fails on a listed path", run("--paths", "src/other.tsx").status === 1);
	expect("--paths with --record is refused", run("--paths", "src/a.tsx", "--record").status === 2);
	rmSync(dir, { recursive: true, force: true });
	console.log(fails ? `${fails} failed` : "all as expected");
	return fails ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) process.exitCode = main(process.argv.slice(2));
