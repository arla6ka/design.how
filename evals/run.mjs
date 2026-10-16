#!/usr/bin/env node
// run.mjs: lint the skills, run the trigger tests, print an incident case. Node 18+, no dependencies.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const HELP = `run.mjs --lint [--root <dir>]            frontmatter, size, links, wording, trigger and incident files
run.mjs --triggers [--host claude|command] [--command "<cmd>"]   ask a host which skill each prompt starts
run.mjs --case <incident id>               print an incident case to run by hand
run.mjs --self-test | --help

--lint checks, and exits 1 with one line per problem
  every SKILL.md has name and a description that starts with "Use", no more than 400 characters
  every SKILL.md is 40 to 150 lines (warn above 150, fail above 300)
  every relative markdown link resolves, and no skill links into a sibling skill's folder
  no private names, no em dashes, no curly quotes in skills/, evals/, GLOSSARY.md, taste.md and README.md
  every trigger skill exists, and every incident's rule phrase is in the file it names
--triggers sends one prompt per case with the six descriptions. The host must print the skill name or "none".`;

const PRIVATE = new RegExp(["Op" + "son", "Exp" + "edite", "Arl" + "an"].join("|"), "i");
const files = (dir, ok, out = []) => {
	for (const n of readdirSync(dir)) {
		if (["node_modules", ".git", "fixtures", "systems"].includes(n)) continue;
		const p = join(dir, n);
		if (statSync(p).isDirectory()) files(p, ok, out); else if (ok(p)) out.push(p);
	}
	return out;
};

export function lint(root) {
	const bad = [];
	const warn = [];
	const skills = join(root, "skills");
	const names = existsSync(skills) ? readdirSync(skills).filter((n) => existsSync(join(skills, n, "SKILL.md"))) : [];
	for (const n of names) {
		const f = join(skills, n, "SKILL.md");
		const text = readFileSync(f, "utf8");
		const lines = text.split("\n").length - 1;
		const fm = /^---\nname: (.+)\ndescription: (.+)\n---\n/.exec(text);
		if (!fm) bad.push(`${n}: frontmatter must be name then description`);
		else {
			if (fm[1] !== n) bad.push(`${n}: name is ${fm[1]}`);
			if (!fm[2].startsWith("Use")) bad.push(`${n}: description must start with "Use" (a trigger, not a workflow)`);
			if (fm[2].length > 400) bad.push(`${n}: description is ${fm[2].length} characters`);
		}
		if (lines < 40) bad.push(`${n}: SKILL.md is ${lines} lines, under 40`);
		if (lines > 300) bad.push(`${n}: SKILL.md is ${lines} lines, over the hard ceiling of 300`);
		else if (lines > 150) warn.push(`${n}: SKILL.md is ${lines} lines, over 150`);
	}
	const prose = files(root, (p) => /\.(md|json|mjs)$/.test(p) && !p.includes("/systems/") && !p.endsWith("run.mjs"));
	for (const p of prose) {
		const rel = relative(root, p);
		const text = readFileSync(p, "utf8");
		if (PRIVATE.test(text)) bad.push(`${rel}: private name`);
		if (p.endsWith(".md")) {
			if (/—/.test(text)) bad.push(`${rel}: em dash`);
			if (/[“”‘’]/.test(text)) bad.push(`${rel}: curly quote`);
			const skillOf = /^skills\/([^/]+)\//.exec(rel)?.[1];
			for (const m of text.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
				if (/^(https?:|mailto:)/.test(m[1])) continue;
				const target = resolve(dirname(p), m[1]);
				if (!existsSync(target)) bad.push(`${rel}: broken link ${m[1]}`);
				const other = /skills\/([^/]+)\//.exec(relative(root, target) + "/")?.[1];
				if (skillOf && other && other !== skillOf) bad.push(`${rel}: links into sibling skill ${other}. Cite it by name`);
			}
		}
	}
	const trig = join(root, "evals/triggers.json");
	if (existsSync(trig)) {
		const t = JSON.parse(readFileSync(trig, "utf8"));
		for (const n of names) if (!t[n]) bad.push(`triggers.json: no entry for ${n}`);
		for (const [n, v] of Object.entries(t)) {
			if (!names.includes(n)) bad.push(`triggers.json: unknown skill ${n}`);
			for (const s of v.should_not_fire) if (!names.includes(s.goes_to)) bad.push(`triggers.json: ${n} sends "${s.prompt}" to unknown ${s.goes_to}`);
		}
	}
	const inc = join(root, "evals/incidents");
	if (existsSync(inc)) {
		for (const f of readdirSync(inc).filter((x) => x.endsWith(".json"))) {
			const c = JSON.parse(readFileSync(join(inc, f), "utf8"));
			const target = join(root, c.rule.file);
			if (!existsSync(target)) bad.push(`incidents/${f}: ${c.rule.file} does not exist`);
			else if (!readFileSync(target, "utf8").includes(c.rule.phrase)) bad.push(`incidents/${f}: "${c.rule.phrase}" is not in ${c.rule.file}`);
		}
	}
	return { bad, warn, skills: names.length };
}

function host(o, prompt) {
	if (o.host === "command") return spawnSync("sh", ["-c", o.command], { input: prompt, encoding: "utf8" }).stdout.trim();
	return spawnSync("claude", ["-p", prompt], { encoding: "utf8" }).stdout.trim();
}

function triggers(root, o) {
	const t = JSON.parse(readFileSync(join(root, "evals/triggers.json"), "utf8"));
	const desc = Object.keys(t).map((n) => `${n}: ${/^description: (.+)$/m.exec(readFileSync(join(root, "skills", n, "SKILL.md"), "utf8"))[1]}`).join("\n");
	let wrong = 0;
	let total = 0;
	for (const [n, v] of Object.entries(t)) {
		const cases = [...v.should_fire.map((p) => [p, n]), ...v.should_not_fire.map((s) => [s.prompt, s.goes_to])];
		for (const [p, want] of cases) {
			const got = host(o, `Skills:\n${desc}\n\nUser message: ${p}\n\nWhich one skill should start? Reply with its name only, or "none".`).split(/\s/)[0];
			total++;
			if (got !== want) { wrong++; console.log(`WRONG  "${p}" -> ${got}, want ${want}`); }
		}
	}
	console.log(`${total - wrong} of ${total} prompts started the right skill`);
	return wrong ? 1 : 0;
}

function selfTest() {
	let fails = 0;
	const t = (name, ok) => { console.log(`${ok ? "ok  " : "FAIL"} ${name}`); if (!ok) fails++; };
	const root = mkdtempSync(join(tmpdir(), "evals-"));
	const w = (f, s) => { mkdirSync(dirname(join(root, f)), { recursive: true }); writeFileSync(join(root, f), s); };
	const body = Array.from({ length: 45 }, (_, i) => `line ${i}`).join("\n") + "\n";
	w("skills/a/SKILL.md", `---\nname: a\ndescription: Use when testing.\n---\n${body}`);
	w("skills/a/references/x.md", "See [y](y.md).\n");
	t("a clean tree lints clean except the broken link", lint(root).bad.join() === "skills/a/references/x.md: broken link y.md");
	w("skills/a/references/y.md", "ok\n");
	t("a resolved link is clean", lint(root).bad.length === 0);
	w("skills/b/SKILL.md", `---\nname: b\ndescription: Does things.\n---\nshort\n`);
	t("a description that is not a trigger, and a short file, fail", lint(root).bad.length === 2);
	rmSync(join(root, "skills/b"), { recursive: true });
	w("skills/a/references/x.md", "See [z](../../b/references/z.md).\n");
	w("skills/b/references/z.md", "z\n");
	t("a link into a sibling skill fails", lint(root).bad.some((m) => /sibling skill b/.test(m)));
	w("skills/a/references/x.md", "A dash — here.\n");
	t("an em dash fails", lint(root).bad.some((m) => /em dash/.test(m)));
	w("skills/a/references/x.md", "fine\n");
	w("evals/incidents/i.json", JSON.stringify({ rule: { file: "skills/a/SKILL.md", phrase: "line 3" } }));
	t("an incident whose phrase is in the rule file passes", lint(root).bad.every((m) => !/incidents/.test(m)));
	w("evals/incidents/i.json", JSON.stringify({ rule: { file: "skills/a/SKILL.md", phrase: "absent words" } }));
	t("an incident whose phrase is missing fails", lint(root).bad.some((m) => /incidents\/i.json/.test(m)));
	rmSync(root, { recursive: true, force: true });
	console.log(fails ? `${fails} failed` : "all as expected");
	return fails ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	const a = process.argv.slice(2);
	const flag = (f) => (a.includes(f) ? a[a.indexOf(f) + 1] : undefined);
	const root = resolve(flag("--root") || join(HERE, ".."));
	if (a.includes("--help") || !a.length) console.log(HELP);
	else if (a.includes("--self-test")) process.exitCode = selfTest();
	else if (a.includes("--lint")) {
		const r = lint(root);
		r.warn.forEach((m) => console.log(`warn ${m}`));
		r.bad.forEach((m) => console.log(`FAIL ${m}`));
		console.log(r.bad.length ? `${r.bad.length} problems` : `lint clean: ${r.skills} skills`);
		process.exitCode = r.bad.length ? 1 : 0;
	} else if (a.includes("--triggers")) process.exitCode = triggers(root, { host: flag("--host") || "claude", command: flag("--command") });
	else if (flag("--case")) {
		const c = JSON.parse(readFileSync(join(root, "evals/incidents", `${flag("--case")}.json`), "utf8"));
		console.log(`Skill: ${c.skill}\nPrompt: ${c.prompt}\nExpect: ${c.expected}\nFails if: ${c.fails_if}`);
	}
}
