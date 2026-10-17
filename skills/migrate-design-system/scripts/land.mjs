#!/usr/bin/env node
// land.mjs: commit the named paths and nothing else, in a checkout other workers share. Node 18+, git 2.20+, no dependencies.
import { spawnSync, execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);

const HELP = `land.mjs <surface> <subject> [flags] -- <paths...>
land.mjs --check-commit <sha> -- <paths...>
land.mjs --self-test | --help

Commits the working-tree state of the named paths and nothing else. Name exact files, because a folder takes everything
under it, other workers' dirty files included.
  1. Takes a lock (a mkdir lock inside .git; a lock whose process died is taken over).
  2. Builds the commit in a private index seeded from HEAD, so a stale shared index cannot reach it.
  3. Refuses when write lines (mutate(, mutateAsync(, onSubmit, execute(, useMutation, non-GET fetch) were added,
     removed or moved and --bodies-check does not exit 0. Decide the tier by this diff, not by a row label.
  4. Refuses when a changed line in an --also file (a ratchet, baseline or list file every worker shares, one row
     per line) names a file outside the named paths, so a file recomputed over a folder cannot carry others' rows.
  5. Refuses when an added comment reads like a working note (worker, verifier, verdict, gate, run folder),
     or when the message carries a process trailer (Verdict:, Verifier:, Worker:, Fingerprint:, Sha256:).
  6. Commits (git hooks run), asserts the commit's file list lies inside the named paths, resets only those
     paths in the shared index, prints "committed <sha>" and then the file list as the last output.

Flags
  --body <file>           commit body, product text only
  --also <path>           a shared file to include, repeatable. Recompute it for your own files only (step 4)
  --bodies-check "<cmd>"  exits 0 when valid request-body evidence is on file (env LAND_BODIES_CHECK). SURFACE is set
  --trailer "<line>"      attribution line from your session, repeatable. Nothing is added on its own
  --run-log <file>        append "time, surface, sha" as TSV here, never to the message
  --allow-notes           skip the working-note scan (report that you did)
  --no-verify             skip git hooks (report that you did)
  --lock-wait <seconds>   default 600
  --dry-run               stage in the private index, print the file list and any write lines, commit nothing

Exit  0 landed  1 failure  2 bad arguments or unsafe path  3 commit touches files outside the set
      4 write lines changed, no valid bodies  5 working note in added code  6 process trailer in message
      7 lock wait timed out  8 a shared file names paths outside the set  9 nothing to commit
Never kill a git child of this script mid-write. If git hangs, report it and wait.`;

class Exit extends Error {
	constructor(code, msg) { super(msg); this.code = code; }
}
const die = (code, msg) => { throw new Exit(code, msg); };

const WRITE_RE = /\b(mutate|mutateAsync|execute|useMutation)\s*\(|\bonSubmit\b|\bfetch\s*\([^)]*method\s*:\s*["'`](POST|PUT|PATCH|DELETE)/i;
const NOTE_RE = /\b(worker|verifier|verdict|run folder|parity (run|table)|baseline capture|wave \d+)\b|\bgate\b/i;
const PATH_RE = /(?:[\w@.-]+\/)+[\w@-][\w@.-]*\.[A-Za-z0-9]+/g;
const COMMENT_RE = /^\s*(\/\/|\/\*|\*|#|\{\/\*|<!--)/;
const TRAILER_RE = /^\s*(verdict|verifier|worker|fingerprint|sha256|checksum)\s*[:=]/im;

const git = (args, o = {}) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256 << 20, ...o });

function parse(argv) {
	const o = { pos: [], paths: [], also: [], trailers: [], lockWait: 600 };
	let dd = false;
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (dd) { o.paths.push(a); continue; }
		const next = () => { if (i + 1 >= argv.length) die(2, `${a} needs a value`); return argv[++i]; };
		if (a === "--") dd = true;
		else if (a === "--help" || a === "-h") o.help = true;
		else if (a === "--self-test") o.selfTest = true;
		else if (a === "--body") o.body = next();
		else if (a === "--also") o.also.push(next());
		else if (a === "--bodies-check") o.bodiesCheck = next();
		else if (a === "--trailer") o.trailers.push(next());
		else if (a === "--run-log") o.runLog = next();
		else if (a === "--lock-wait") o.lockWait = Number(next());
		else if (a === "--check-commit") o.checkCommit = next();
		else if (a === "--allow-notes") o.allowNotes = true;
		else if (a === "--no-verify") o.noVerify = true;
		else if (a === "--dry-run") o.dry = true;
		else if (a.startsWith("-")) die(2, `unknown flag ${a} (see --help)`);
		else o.pos.push(a);
	}
	return o;
}

function normalize(paths, root) {
	return paths.map((p) => {
		if (!p || [".", "./", "*", "**", ":/"].includes(p) || p.startsWith("..") || p.includes("/../")) die(2, `refusing path '${p}': name exact files or folders`);
		const rel = relative(root, isAbsolute(p) ? p : resolve(process.cwd(), p)).split("\\").join("/");
		if (!rel || rel.startsWith("..")) die(2, `path '${p}' is outside the repository`);
		return rel.replace(/\/$/, "");
	});
}

const inSet = (f, set) => set.some((p) => f === p || f.startsWith(p + "/"));
const commitFiles = (sha) => git(["diff-tree", "--no-commit-id", "--name-only", "-r", "--no-renames", "--root", sha]).split("\n").filter(Boolean);

function assertFiles(sha, set) {
	const files = commitFiles(sha);
	const stray = files.filter((f) => !inSet(f, set));
	if (stray.length) {
		const short = git(["rev-parse", "--short", sha]).trim();
		die(3, `commit ${short} touches files outside the named set: ${stray.join(" ")}\nundo with: git revert --no-commit ${short} then restore the intended files`);
	}
	return files;
}

function pidAlive(pid) {
	try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; }
}

async function lock(wait) {
	const dir = join(resolve(git(["rev-parse", "--git-common-dir"]).trim()), "land.lock");
	const until = Date.now() + wait * 1000;
	for (;;) {
		try { mkdirSync(dir); break; } catch (e) {
			if (e.code !== "EEXIST") throw e;
			let holder = 0;
			try { holder = Number(readFileSync(join(dir, "pid"), "utf8")); } catch { /* holder is between mkdir and writing its pid */ }
			if (holder && !pidAlive(holder)) { console.error(`land.mjs: taking over a lock whose holder ${holder} is gone`); rmSync(dir, { recursive: true, force: true }); continue; }
			if (Date.now() > until) die(7, `lock ${dir} still held by pid ${holder || "unknown"}; do not delete it while that process runs`);
			await new Promise((r) => setTimeout(r, 200));
		}
	}
	writeFileSync(join(dir, "pid"), String(process.pid));
	const release = () => rmSync(dir, { recursive: true, force: true });
	process.on("exit", release);
	for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => { release(); process.exit(130); });
}

function scanDiff(diff) {
	const writes = [];
	const notes = [];
	let file = "";
	for (const line of diff.split("\n")) {
		if (line.startsWith("+++ ")) { file = line.slice(4).replace(/^b\//, ""); continue; }
		if (line.startsWith("--- ") || (!line.startsWith("+") && !line.startsWith("-"))) continue;
		const text = line.slice(1);
		if (WRITE_RE.test(text)) writes.push(`${file}: ${line.slice(0, 120)}`);
		if (line.startsWith("+") && COMMENT_RE.test(text) && NOTE_RE.test(text)) notes.push(`${file}: ${line.slice(0, 120)}`);
	}
	return { writes, notes };
}

export async function land(o) {
	const root = git(["rev-parse", "--show-toplevel"]).trim();
	if (o.checkCommit) { assertFiles(o.checkCommit, normalize(o.paths, root)); return; }
	if (o.pos.length !== 2) die(2, "expected <surface> <subject> -- <paths...> (see --help)");
	const [surface, subject] = o.pos;
	if (!o.paths.length) die(2, "no paths after --");
	const set = normalize([...o.paths, ...o.also], root);
	const body = o.body ? (existsSync(o.body) ? readFileSync(o.body, "utf8").trim() : die(2, `body file ${o.body} not found`)) : "";
	const message = [subject, body, o.trailers.join("\n")].filter(Boolean).join("\n\n") + "\n";
	if (TRAILER_RE.test(message)) die(6, "the message carries a process trailer. Verdicts, ids and checksums go to --run-log, not into a commit");

	process.chdir(root);
	await lock(o.lockWait);
	const tmp = mkdtempSync(join(tmpdir(), "land-"));
	const idx = join(tmp, "index");
	const env = { ...process.env, GIT_INDEX_FILE: idx };
	try {
		git(["read-tree", "HEAD"], { env });
		git(["add", "-A", "--", ...set], { env });
		if (spawnSync("git", ["diff-index", "--cached", "--quiet", "HEAD", "--"], { env }).status === 0) die(9, `nothing to commit for ${set.join(" ")}`);
		const own = normalize(o.paths, root);
		for (const shared of normalize(o.also, root)) {
			const changed = git(["diff-index", "--cached", "-p", "--no-color", "-U0", "HEAD", "--", shared], { env }).split("\n").filter((l) => /^[+-](?![+-]{2} )/.test(l));
			const foreign = [...new Set(changed.flatMap((l) => l.match(PATH_RE) || []))].filter((f) => f !== shared && !inSet(f, own));
			if (foreign.length) die(8, `${shared} changes rows for files outside this landing: ${foreign.join(" ")}. Recompute it for your own files only`);
		}

		const { writes, notes } = scanDiff(git(["diff-index", "--cached", "-p", "--no-color", "--no-ext-diff", "-U0", "HEAD", "--"], { env }));
		if (writes.length) {
			console.error(`write lines changed in this surface:\n${writes.join("\n")}`);
			const cmd = o.bodiesCheck || process.env.LAND_BODIES_CHECK;
			if (!cmd) die(4, "write lines changed and no --bodies-check is set. Nothing was committed");
			if (spawnSync("sh", ["-c", cmd], { stdio: "inherit", env: { ...process.env, SURFACE: surface } }).status !== 0) die(4, "the bodies check failed, so the body evidence is not valid. Nothing was committed");
		}
		if (notes.length && !o.allowNotes) die(5, `added comments read like working notes. Describe the product, not the process:\n${notes.join("\n")}`);

		if (o.dry) { console.log("dry run, would commit:\n" + git(["diff-index", "--cached", "--name-only", "--no-renames", "HEAD", "--"], { env }).trim()); return; }

		const msg = join(tmp, "message");
		writeFileSync(msg, message);
		const before = git(["rev-parse", "HEAD"]).trim();
		const c = spawnSync("git", ["commit", "-q", ...(o.noVerify ? ["--no-verify"] : []), "-F", msg], { env, encoding: "utf8" });
		if (c.status !== 0) die(1, `git commit failed, nothing landed\n${c.stderr || c.stdout}`);
		const sha = git(["rev-parse", "HEAD"]).trim();
		if (sha === before) die(1, "HEAD did not move");
		const files = assertFiles(sha, set);

		const reset = spawnSync("git", ["reset", "-q", "--", ...set], { encoding: "utf8" });
		if (reset.status !== 0) console.error(`WARN could not reset the shared index (an index.lock may be left by a killed git). Report it and wait. ${reset.stderr.trim()}`);
		if (o.runLog) { mkdirSync(dirname(resolve(o.runLog)), { recursive: true }); appendFileSync(o.runLog, `${new Date().toISOString()}\t${surface}\t${sha}\n`); }
		console.log(`committed ${sha}`);
		console.log(files.join("\n"));
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
}

// ---------------------------------------------------------------- self-test
function selfTest() {
	const base = mkdtempSync(join(tmpdir(), "land-st-"));
	const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", GIT_AUTHOR_NAME: "T", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "T", GIT_COMMITTER_EMAIL: "t@t" };
	delete env.GIT_INDEX_FILE;
	let fails = 0;
	const check = (name, got, want) => { if (got === want) console.log(`ok   ${name}`); else { fails++; console.log(`FAIL ${name} (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`); } };
	const sh = (cwd, ...a) => execFileSync("git", a, { cwd, env, encoding: "utf8" }).trim();
	const run = (cwd, ...a) => spawnSync(process.execPath, [SELF, ...a], { cwd, env, encoding: "utf8" });
	let n = 0;
	const mk = () => {
		const d = join(base, `r${++n}`);
		mkdirSync(d);
		sh(d, "init", "-q");
		sh(d, "symbolic-ref", "HEAD", "refs/heads/main");
		writeFileSync(join(d, "route.txt"), "route v1\n");
		writeFileSync(join(d, "other.txt"), "other v1\n");
		sh(d, "add", "-A");
		sh(d, "commit", "-q", "-m", "init");
		return d;
	};
	const w = (d, f, t) => { mkdirSync(dirname(join(d, f)), { recursive: true }); writeFileSync(join(d, f), t); };
	const count = (d) => Number(sh(d, "rev-list", "--count", "HEAD"));

	let r = mk();
	w(r, "route.txt", "route v2\n"); w(r, "other.txt", "other dirty\n");
	let p = run(r, "s1", "Move route", "--", "route.txt");
	check("basic: last line is the file", p.stdout.trim().split("\n").pop(), "route.txt");
	check("basic: foreign dirty file stays dirty", sh(r, "status", "--porcelain"), "M other.txt");
	check("basic: shared index has no leftover", sh(r, "diff", "--cached", "--name-only"), "");

	r = mk();
	const stale = sh(r, "rev-parse", "HEAD:route.txt");
	w(r, "route.txt", "route v2\n"); sh(r, "add", "route.txt"); sh(r, "commit", "-q", "-m", "landed v2");
	sh(r, "update-index", "--cacheinfo", `100644,${stale},route.txt`);
	w(r, "other.txt", "other v2\n");
	run(r, "s2", "Land other", "--", "other.txt");
	check("stale shared index: commit lists only other.txt", sh(r, "show", "--name-only", "--format=", "HEAD"), "other.txt");
	check("stale shared index: landed route is still v2", sh(r, "show", "HEAD:route.txt"), "route v2");

	r = mk();
	w(r, "new.tsx", "export const A = () => { mutate({ id: 1 }) }\n");
	check("write lines, no bodies: exit 4", run(r, "s3", "New", "--", "new.tsx").status, 4);
	check("write lines: nothing committed", count(r), 1);
	check("failing bodies check: exit 4", run(r, "s3", "New", "--bodies-check", "false", "--", "new.tsx").status, 4);
	check("valid bodies check lands", run(r, "s3", "New", "--bodies-check", "true", "--", "new.tsx").status, 0);

	r = mk();
	w(r, "a.tsx", "export const A = () => { mutate({ id: 1 }) }\n"); sh(r, "add", "a.tsx"); sh(r, "commit", "-q", "-m", "add a");
	w(r, "a.tsx", "export const A = () => {}\n"); w(r, "b.tsx", "export const B = () => { mutate({ id: 1 }) }\n");
	check("moved write call, no bodies: exit 4", run(r, "s4", "Move", "--", "a.tsx", "b.tsx").status, 4);

	r = mk();
	w(r, "route.txt", "route v2\n");
	writeFileSync(join(r, ".git/hooks/pre-commit"), "#!/bin/sh\necho x > stray.txt\ngit add stray.txt\n"); chmodSync(join(r, ".git/hooks/pre-commit"), 0o755);
	check("stray file from a hook: exit 3", run(r, "s5", "Route", "--", "route.txt").status, 3);
	check("--check-commit exits 3 for the stray commit", run(r, "--check-commit", "HEAD", "--", "route.txt").status, 3);
	check("--check-commit exits 0 when the set covers it", run(r, "--check-commit", "HEAD", "--", "route.txt", "stray.txt").status, 0);

	r = mk();
	check("path . is refused: exit 2", run(r, "s6", "x", "--", ".").status, 2);
	check("nothing changed: exit 9", run(r, "s6", "x", "--", "route.txt").status, 9);

	r = mk();
	w(r, "route.txt", "route v2\n");
	writeFileSync(join(r, "body.txt"), "Verdict: verified\n");
	check("process trailer in the body: exit 6", run(r, "s7", "Route", "--body", "body.txt", "--", "route.txt").status, 6);
	check("process trailer: nothing committed", count(r), 1);
	check("attribution trailer is allowed", run(r, "s7", "Route", "--trailer", "Co-Authored-By: A <a@x>", "--", "route.txt").status, 0);
	check("attribution reaches the message", sh(r, "log", "-1", "--format=%B").includes("Co-Authored-By: A"), true);

	r = mk();
	w(r, "x.ts", "// the verifier checked this gate\nexport const x = 1\n");
	check("working note in a comment: exit 5", run(r, "s8", "X", "--", "x.ts").status, 5);
	check("--allow-notes lands it", run(r, "s8", "X", "--allow-notes", "--", "x.ts").status, 0);

	r = mk();
	const lock = join(r, ".git/land.lock");
	mkdirSync(lock); writeFileSync(join(lock, "pid"), "999999");
	w(r, "route.txt", "route v2\n");
	check("a lock whose holder died is taken over", run(r, "s9", "Route", "--", "route.txt").status, 0);
	check("the lock is released after landing", existsSync(lock), false);

	r = mk();
	w(r, "route.txt", "route v2\n"); w(r, "baseline.json", "{}\n");
	run(r, "s10", "Route", "--also", "baseline.json", "--", "route.txt");
	check("--also adds the baseline file", sh(r, "show", "--name-only", "--format=", "HEAD").split("\n").sort().join(" "), "baseline.json route.txt");
	w(r, "src/a.tsx", "a\n"); w(r, "baseline.json", '{"src/a.tsx": 1, "src/b.tsx": 4}\n');
	check("a shared file carrying another file's row: exit 8", run(r, "s10", "A", "--also", "baseline.json", "--", "src/a.tsx").status, 8);
	w(r, "baseline.json", '{"src/a.tsx": 1}\n');
	check("a shared file changed only for its own files lands", run(r, "s10", "A", "--also", "baseline.json", "--", "src/a.tsx").status, 0);
	w(r, "other.txt", "other v2\n");
	run(r, "s10", "x", "--dry-run", "--", "other.txt");
	check("--dry-run commits nothing", count(r), 3);

	r = mk();
	w(r, "dir/a.txt", "x\n"); w(r, "dir/b.txt", "y\n"); sh(r, "add", "dir"); sh(r, "commit", "-q", "-m", "dir");
	rmSync(join(r, "dir/a.txt")); w(r, "dir/b.txt", "z\n");
	run(r, "s11", "Dir", "--", "dir");
	check("a folder lands deletions and edits under it", sh(r, "show", "--name-only", "--format=", "HEAD").split("\n").sort().join(" "), "dir/a.txt dir/b.txt");

	rmSync(base, { recursive: true, force: true });
	console.log(fails ? `${fails} failed` : "all as expected");
	return fails ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	try {
		const o = parse(process.argv.slice(2));
		if (o.help) console.log(HELP);
		else if (o.selfTest) process.exitCode = selfTest();
		else await land(o);
	} catch (e) {
		if (e instanceof Exit) { console.error(`land.mjs: ${e.message}`); process.exitCode = e.code; } else throw e;
	}
}
