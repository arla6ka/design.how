#!/usr/bin/env node
// parity.mjs: the number and date parity tables. Node 18+, no dependencies.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SELF = fileURLToPath(import.meta.url);

const HELP = `parity.mjs number|date --old <module.mjs|results.json> --new <module.mjs|results.json> [--fn <name>] [--expect <file>] [--json]
parity.mjs date ... [--tz A,B,C] [--cases <file>]
parity.mjs --print-inputs | --self-test | --help

Runs the same inputs through the old and the new code and prints one row per input
  case | old result | new result | expectation | verdict
A module exports the function (default export, or --fn name, default "parse" for number and "toPayload" for date). It takes
the typed text and returns the committed value, or throws to reject it. A results file is JSON {"<input>": result}
(for date {"<zone>": {"<input>": result}}) that you filled from the real controls in a browser.
number  runs the 19 inputs: ${"2.5, -3, 1e3, 12.50, 0.123456789, 1,234.56, ' 42 ', '', abc, 12abc, 007, -0, a 20-digit number, 1.2.3, .5, 5., +3, a Unicode minus, '1 000'"}.
date    runs each case in a child process once per zone (TZ is real). Default zones America/Los_Angeles, Asia/Tokyo, UTC,
        Pacific/Auckland. Cases are a JSON list of strings. If the OLD code already answers differently per zone, the row
        says "report it" and passes only while the new code matches. Never fix that inside the migration.
Expectations file: {"<input or zone input>": "same" | "rejected" | "intended change" | "preexisting", "*": "same"}, or
{"expect": "intended change", "note": "why"}. Missing keys mean "same". An "intended change" row that does not change fails.
Exit 0 only when every row is as expected.`;

export const INPUTS = ["2.5", "-3", "1e3", "12.50", "0.123456789", "1,234.56", "  42 ", "", "abc", "12abc", "007", "-0", "99999999999999999999", "1.2.3", ".5", "5.", "+3", "−3", "1 000"];
export const ZONES = ["America/Los_Angeles", "Asia/Tokyo", "UTC", "Pacific/Auckland"];
export const DATE_CASES = ["2025-03-15", "2025-01-01", "2025-12-31", "2024-02-29", "2025-03-15T00:00:00.000Z"];

const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v);
const stable = (v) => JSON.stringify(sortKeys(v)) ?? "undefined";
const same = (a, b) => stable(a) === stable(b);

// A child process computes {input: result} for one module in one zone.
async function childMain(argv) {
	const get = (f) => argv[argv.indexOf(f) + 1];
	const mod = await import(pathToFileURL(get("--module")).href);
	const fn = mod[get("--fn")] ?? mod.default;
	const out = {};
	for (const input of JSON.parse(process.env.PARITY_INPUTS)) {
		try { const v = await fn(input); out[input] = v instanceof Date ? v.toISOString() : v === undefined ? null : v; } catch (e) { out[input] = { rejected: true }; }
	}
	process.stdout.write(JSON.stringify(out));
}

function computeMap(spec, fn, inputs, tz) {
	if (spec.endsWith(".json")) {
		const j = JSON.parse(readFileSync(resolve(spec), "utf8"));
		return tz && j[tz] ? j[tz] : j;
	}
	const r = spawnSync(process.execPath, [SELF, "--child", "--module", resolve(spec), "--fn", fn], { env: { ...process.env, ...(tz ? { TZ: tz } : {}), PARITY_INPUTS: JSON.stringify(inputs) }, encoding: "utf8" });
	if (r.status !== 0) throw new Error(`${spec} failed${tz ? ` under TZ=${tz}` : ""}: ${(r.stderr || r.stdout).trim().split("\n").slice(-2).join(" ")}`);
	return JSON.parse(r.stdout);
}

export function runParity({ kind, oldSpec, newSpec, fn, inputs, zones, expect = {} }) {
	const groups = kind === "date" ? zones : [null];
	const maps = groups.map((tz) => ({ tz, old: computeMap(oldSpec, fn, inputs, tz), neu: computeMap(newSpec, fn, inputs, tz) }));
	const oldVaries = (input) => kind === "date" && !maps.every((m) => same(m.old[input], maps[0].old[input]));
	const rows = [];
	for (const m of maps) {
		for (const input of inputs) {
			const id = `${m.tz ? m.tz + " " : ""}${JSON.stringify(input)}`;
			const e = expect[id] ?? expect[input] ?? expect["*"] ?? "same";
			const want = String(e && typeof e === "object" ? e.expect : e).toLowerCase();
			const o = m.old[input];
			const n = m.neu[input];
			const eq = same(o, n);
			let v;
			if (oldVaries(input) && want !== "intended change") v = eq ? ["ok (old answer is zone-dependent: report it, do not fix it here)", true] : ["FAIL changed a pre-existing zone-dependent answer inside the migration", false];
			else if (want === "same") v = eq ? ["ok", true] : ["FAIL differs, expected same", false];
			else if (want === "rejected") v = n && n.rejected ? ["ok", true] : ["FAIL new did not reject", false];
			else if (want === "intended change") v = eq ? ["FAIL no change, expected one", false] : ["ok (approve this change)", true];
			else if (want === "preexisting") v = eq ? ["ok (pre-existing, report it)", true] : ["FAIL changed a pre-existing behaviour", false];
			else v = [`FAIL unknown expectation "${want}"`, false];
			rows.push({ id, old: o, neu: n, expectation: want, verdict: v[0], ok: v[1] });
		}
	}
	return rows;
}

const trunc = (s, max) => (s.length > max ? s.slice(0, max - 1) + "~" : s);
const cell = (v, max = 40) => { const s = (typeof v === "string" ? JSON.stringify(v) : stable(v)).replace(/\s+/g, " "); return s.length > max ? s.slice(0, max - 1) + "~" : s; };

export function render(rows) {
	const head = ["case", "old result", "new result", "expectation", "verdict"];
	const body = rows.map((r) => [trunc(r.id, 44), cell(r.old), cell(r.neu), r.expectation, r.verdict]);
	const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
	const line = (c) => c.map((x, i) => x.padEnd(w[i])).join(" | ").trimEnd();
	const bad = rows.filter((r) => !r.ok).length;
	return [line(head), w.map((n) => "-".repeat(n)).join("-+-"), ...body.map(line), "", bad ? `NOT as expected: ${bad} of ${rows.length} rows` : `all as expected (${rows.length} rows)`].join("\n");
}

function selfTest() {
	let fails = 0;
	const t = (name, ok, detail = "") => { console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : "\n" + detail}`); if (!ok) fails++; };
	const dir = mkdtempSync(join(tmpdir(), "parity-"));
	const mod = (n, src) => { const p = join(dir, n); writeFileSync(p, src); return p; };
	const ref = mod("ref.mjs", `export const parse = (t) => { let s = String(t).trim().replace(/\\u2212/g, "-"); if (s === "") return null; if (/^[+-]?\\d{1,3}([, ]\\d{3})+$/.test(s)) s = s.replace(/[, ]/g, ""); if (!/^[+-]?\\d+$/.test(s)) throw new Error("no"); return s.replace(/^\\+/, ""); };`);
	const ctl = mod("ctl.mjs", `import { parse as p } from "./ref.mjs"; export const parse = (t) => { if (String(t).trim().startsWith("+")) throw new Error("plus rejected"); return p(t); };`);
	const bug = mod("bug.mjs", `export const parse = (t) => { const d = String(t).replace(/\\D/g, ""); return d === "" ? null : d; };`);
	const num = (o, n, expect) => runParity({ kind: "number", oldSpec: o, newSpec: n, fn: "parse", inputs: INPUTS, expect });
	t("19 number inputs", INPUTS.length === 19);
	t("identical code passes", num(ref, ref).every((r) => r.ok));
	t("digit-stripping code is flagged on 2.5, -3 and 1e3", ["\"2.5\"", "\"-3\"", "\"1e3\""].every((id) => num(ref, bug).some((r) => !r.ok && r.id === id)));
	t("an intended rejection passes when recorded", num(ref, ctl, { "+3": "rejected" }).every((r) => r.ok));
	t("an unrecorded change is flagged", num(ref, ctl).some((r) => !r.ok && r.id === "\"+3\""));
	t("an intended change that does not change is flagged", num(ref, ref, { "+3": "intended change" }).some((r) => !r.ok));
	const oj = join(dir, "old.json"), nj = join(dir, "new.json");
	writeFileSync(oj, JSON.stringify({ "2.5": "2.5", "-3": "-3" }));
	writeFileSync(nj, JSON.stringify({ "2.5": "25", "-3": "-3" }));
	const jr = runParity({ kind: "number", oldSpec: oj, newSpec: nj, fn: "parse", inputs: ["2.5", "-3"] });
	t("results files work: the hand-filled row that differs is flagged", jr.filter((r) => !r.ok).map((r) => r.id).join() === "\"2.5\"");

	const oldD = mod("old-d.mjs", `export const toPayload = (s) => String(s).slice(0, 10);`);
	const goodD = mod("good-d.mjs", `export const toPayload = (s) => String(s).slice(0, 10);`);
	const badD = mod("bad-d.mjs", `export const toPayload = (s) => new Date(s).toLocaleDateString("en-CA");`);
	const date = (o, n, expect) => runParity({ kind: "date", oldSpec: o, newSpec: n, fn: "toPayload", inputs: DATE_CASES, zones: ZONES, expect });
	t("date: a clean pair passes in four zones", date(oldD, goodD).every((r) => r.ok));
	const bad = date(oldD, badD).filter((r) => !r.ok);
	t("date: a local-time rewrite shifts a day in the west zone", bad.some((r) => r.id.startsWith("America/Los_Angeles")));
	t("date: the east zone is not blamed for the west-zone defect", !bad.some((r) => r.id.startsWith("Asia/Tokyo \"2025-03-15\"")));
	const pre = date(badD, badD);
	t("date: a pre-existing zone bug passes while new equals old", pre.every((r) => r.ok) && pre.some((r) => /report it/.test(r.verdict)));
	t("date: fixing it inside the migration is flagged", date(badD, goodD).some((r) => !r.ok && /pre-existing/.test(r.verdict)));
	rmSync(dir, { recursive: true, force: true });
	console.log(fails ? `${fails} failed` : "all as expected");
	return fails ? 1 : 0;
}

async function cli(argv) {
	if (argv.includes("--child")) return childMain(argv);
	if (argv.includes("--help") || argv.length === 0) return console.log(HELP);
	if (argv.includes("--self-test")) { process.exitCode = selfTest(); return; }
	if (argv.includes("--print-inputs")) return console.log(JSON.stringify({ number: INPUTS, date: DATE_CASES, zones: ZONES }, null, 2));
	const kind = argv[0];
	const flag = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : undefined);
	if (!["number", "date"].includes(kind) || !flag("--old") || !flag("--new")) { console.error("usage: parity.mjs number|date --old <x> --new <y>. See --help"); process.exitCode = 2; return; }
	const rows = runParity({
		kind, oldSpec: flag("--old"), newSpec: flag("--new"), fn: flag("--fn") || (kind === "number" ? "parse" : "toPayload"),
		inputs: kind === "date" && flag("--cases") ? JSON.parse(readFileSync(flag("--cases"), "utf8")) : kind === "date" ? DATE_CASES : INPUTS,
		zones: flag("--tz") ? flag("--tz").split(",") : ZONES, expect: flag("--expect") ? JSON.parse(readFileSync(flag("--expect"), "utf8")) : {},
	});
	console.log(argv.includes("--json") ? JSON.stringify(rows, null, 2) : render(rows));
	process.exitCode = rows.every((r) => r.ok) ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) await cli(process.argv.slice(2));
