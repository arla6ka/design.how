#!/usr/bin/env node
// capture-guard.mjs: deny-by-default network guard for any script that drives a browser against a live app.
// Node 18+, no dependencies. Works as a module (installGuard, decide, classifyName) and as a CLI.
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const HELP = `capture-guard.mjs: deny-by-default network guard for browser capture scripts

Usage
  node capture-guard.mjs names <procedure>... [--procedure-style rpc-post|rest] [--read-procedures a,b] [--read-verbs ...]
      Prints read or deny for each procedure name. Run it on the app's real procedure list before a capture.
  node capture-guard.mjs decide --method POST --url <url> [--body <text>] [--fixtures <json>] [options]
      Prints the decision as JSON: {action: fulfill|continue|abort, reason}.
  node capture-guard.mjs prove --writes <file> [options]
      The dry run before any run that can reach a backend. Each line of the file is "METHOD URL" for a write the
      app really sends, copied from its network log in the shape it has there. Exits 1 if any one would continue.
      Pass the same options the capture uses. Then fire the same writes from the page and read guard.log.
  node capture-guard.mjs --self-test
  node capture-guard.mjs --help

Options (CLI and the opts object of decide and installGuard)
  --procedure-style <s>   rpc-post (default) or rest. oRPC and other RPC styles send reads as POST, so
                          "abort every non-GET" blocks the app. rest allows GET/HEAD only.
  --app-origin <url>      repeatable. Origins that serve the app and its assets. Default: any local host.
  --allow-host <host>     repeatable. A non-local host that may be reached (almost never right).
  --read-procedures <a,b> exact procedure names (cases/fileUrl) that continue. By default only these do.
  --read-verbs <a,b>      opt in to prefix matching: a POST whose name starts with one of these verbs also
                          continues. "default" means ${"get,list,me,find,search,read,check,preview,count"}. A name like
                          getOrCreate can write, so prefer exact names for any run that reaches a real backend.
  --fixtures <json>       {"<procedure or last segment>": {"status":200,"body":{...}}}. Matched calls are
                          fulfilled in the browser and never reach the backend, whatever the method.
  --log <file>            JSON lines, one per decision (installGuard writes it as guard.log).

Rules
  1. A host that is not local is aborted.
  2. A fixture match is fulfilled.
  3. GET and HEAD to the app origin continue (documents, assets, GET reads).
  4. In rpc-post style a POST continues only when --read-procedures lists it. With --read-verbs, it also
     continues when the last path segment, split into tokens on / . - _ and camelCase boundaries, starts
     with a read verb and holds no write token. Anything else is aborted, and the reason names the two
     ways out: add a fixture or list the procedure in --read-procedures.
  5. PUT, PATCH, DELETE and every other method are aborted.
  6. A write is never continued. Held routes are aborted by releaseAll() before the page closes.`;

export const PREFIX_READ_VERBS = ["get", "list", "me", "find", "search", "read", "check", "preview", "count"];
export const WRITE_TOKENS = ["create", "update", "delete", "remove", "set", "modify", "add", "send", "submit", "upload", "invite", "sign", "approve", "reject", "cancel", "save", "write", "publish", "revoke", "archive", "restore", "exercise", "grant", "pay", "file", "execute", "mutate", "patch", "put", "post", "import", "reset", "confirm", "accept", "decline", "assign", "move", "merge"];
// "file" is a write token only in a non-leading position (getOrFile). Leading tokens are judged by the verb list.
const ASSET_EXT = /\.(js|mjs|css|map|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|json|html|txt|wasm)$/i;

export function tokens(name) {
	return String(name)
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
		.split(/[\s/._\-]+/)
		.filter(Boolean)
		.map((t) => t.toLowerCase());
}

export function lastSegment(procOrPath) {
	const parts = String(procOrPath).split("/").filter(Boolean);
	return parts[parts.length - 1] || "";
}

// Judges one procedure name. Exact names only, unless readVerbs opts in to prefix matching: then the first
// token must be a read verb and no later token may be a write token.
export function classifyName(name, opts = {}) {
	const verbs = (opts.readVerbs || []).filter(Boolean);
	const exact = opts.readProcedures || [];
	if (exact.includes(name) || exact.includes(lastSegment(name))) return { read: true, why: "listed in readProcedures" };
	if (!verbs.length) return { read: false, why: "not listed in readProcedures" };
	const t = tokens(lastSegment(name));
	if (!t.length) return { read: false, why: "empty name" };
	if (!verbs.includes(t[0])) return { read: false, why: `first token "${t[0]}" is not a read verb` };
	const w = t.slice(1).find((x) => x !== "file" && WRITE_TOKENS.includes(x));
	if (w) return { read: false, why: `read verb "${t[0]}" followed by write token "${w}"` };
	return { read: true, why: `read verb "${t[0]}"` };
}

export function isLocalHost(host) {
	const h = String(host).replace(/^\[|\]$/g, "").toLowerCase();
	return h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".localhost");
}

export function procedureOf(url) {
	let u;
	try { u = new URL(url); } catch { return ""; }
	return u.pathname.split("/").filter(Boolean).slice(-2).join("/");
}

function findFixture(fixtures, url) {
	if (!fixtures) return null;
	let path;
	try { path = new URL(url).pathname; } catch { return null; }
	const segs = path.split("/").filter(Boolean);
	const keys = [segs.slice(-2).join("/"), segs[segs.length - 1], path];
	for (const k of keys) if (k && Object.prototype.hasOwnProperty.call(fixtures, k)) return { key: k, fx: fixtures[k] };
	return null;
}

// Pure. {method, url, postData} in, {action, reason, response?} out.
export function decide(req, opts = {}) {
	const style = opts.procedureStyle || "rpc-post";
	if (!["rpc-post", "rest"].includes(style)) throw new Error(`procedureStyle must be rpc-post or rest, got ${style}`);
	const method = String(req.method || "GET").toUpperCase();
	let u;
	try { u = new URL(req.url); } catch { return { action: "abort", reason: "unparseable url" }; }
	if (["data:", "blob:", "about:"].includes(u.protocol)) return { action: "continue", reason: `${u.protocol} is not network` };
	const allowed = (opts.allowHosts || []).map((h) => h.toLowerCase());
	if (!isLocalHost(u.hostname) && !allowed.includes(u.hostname.toLowerCase()))
		return { action: "abort", reason: `non-local host ${u.hostname}` };
	if (opts.appOrigins?.length && !opts.appOrigins.includes(u.origin) && !allowed.includes(u.hostname.toLowerCase()))
		return { action: "abort", reason: `origin ${u.origin} is not an app origin` };
	const hit = findFixture(opts.fixtures, req.url);
	if (hit) {
		const fx = hit.fx;
		return { action: "fulfill", reason: `fixture ${hit.key}`, response: { status: fx.status ?? 200, contentType: fx.contentType || "application/json", body: typeof fx.body === "string" ? fx.body : JSON.stringify(fx.body ?? null) } };
	}
	if (method === "GET" || method === "HEAD") return { action: "continue", reason: "GET to a local host" };
	if (method === "OPTIONS") return { action: "continue", reason: "preflight" };
	if (method === "POST") {
		const proc = procedureOf(req.url);
		const exact = opts.readProcedures || [];
		if (style === "rest" && !(exact.includes(proc) || exact.includes(lastSegment(proc))))
			return { action: "abort", reason: `POST ${proc} in rest style; fixture it or list it in readProcedures` };
		if (ASSET_EXT.test(u.pathname)) return { action: "abort", reason: "POST to an asset path" };
		const c = classifyName(proc, opts);
		if (c.read) return { action: "continue", reason: `read ${proc}: ${c.why}` };
		return { action: "abort", reason: `deny ${proc}: ${c.why}. Fixture it or list it in readProcedures if it is a read` };
	}
	return { action: "abort", reason: `${method} is never continued` };
}

// target: a Playwright Page or BrowserContext, or anything with route(pattern, handler).
// The handler's route object needs request() with method(), url(), postData(), and fulfill, continue, abort.
// Pure. Lines of "METHOD URL" in, the ones a guard with these options would let through out.
export function prove(lines, opts = {}) {
	return lines.map((l) => l.trim().split(/\s+/)).filter((p) => p.length >= 2)
		.map(([method, url]) => ({ method, url, ...decide({ method, url }, opts) })).filter((d) => d.action === "continue");
}

export function installGuard(target, opts = {}) {
	const log = [];
	const held = new Set();
	const holdNames = opts.hold || [];
	const record = (entry) => {
		const line = { t: new Date().toISOString(), ...entry };
		log.push(line);
		if (opts.logFile) appendFileSync(opts.logFile, JSON.stringify(line) + "\n");
	};
	const handler = async (route) => {
		const r = route.request();
		const req = { method: r.method(), url: r.url(), postData: r.postData ? r.postData() : undefined };
		const d = decide(req, opts);
		const proc = procedureOf(req.url);
		const wantsHold = holdNames.some((h) => h === proc || h === lastSegment(proc));
		if (wantsHold) {
			held.add(route);
			return record({ method: req.method, url: req.url, proc, action: "hold", reason: `held (${d.reason}); aborted by releaseAll` });
		}
		record({ method: req.method, url: req.url, proc, action: d.action, reason: d.reason });
		try {
			if (d.action === "fulfill") await route.fulfill(d.response);
			else if (d.action === "continue") await route.continue();
			else await route.abort();
		} catch (e) {
			record({ method: req.method, url: req.url, proc, action: "error", reason: String(e.message || e) });
		}
	};
	const ready = target.route(opts.pattern || "**/*", handler);
	return {
		ready,
		log,
		heldCount: () => held.size,
		// Aborts every held route. Call it before page.close(); a route released after close can still reach the backend.
		async releaseAll() {
			const routes = [...held];
			held.clear();
			for (const route of routes) {
				const r = route.request();
				record({ method: r.method(), url: r.url(), proc: procedureOf(r.url()), action: "abort", reason: "held route aborted at release" });
				try { await route.abort(); } catch { /* page already gone */ }
			}
			return routes.length;
		},
		async closePage(page) {
			await this.releaseAll();
			await page.close();
		},
	};
}

// ---- CLI ----
function parse(argv) {
	const o = { _: [], appOrigins: [], allowHosts: [] };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		const next = () => argv[++i];
		if (a === "--procedure-style") o.procedureStyle = next();
		else if (a === "--app-origin") o.appOrigins.push(next());
		else if (a === "--allow-host") o.allowHosts.push(next());
		else if (a === "--read-verbs") { const v = next(); o.readVerbs = v === "default" ? PREFIX_READ_VERBS : v.split(","); }
		else if (a === "--read-procedures") o.readProcedures = next().split(",");
		else if (a === "--fixtures") o.fixtures = JSON.parse(readFileSync(next(), "utf8"));
		else if (a === "--method") o.method = next();
		else if (a === "--url") o.url = next();
		else if (a === "--body") o.body = next();
		else if (a === "--log") o.logFile = next();
		else if (a === "--writes") o.writes = next();
		else if (a === "--help" || a === "-h") o.help = true;
		else if (a === "--self-test") o.selfTest = true;
		else o._.push(a);
	}
	return o;
}

function fakePage() {
	const calls = [];
	let handler;
	const page = {
		calls,
		async route(_p, h) { handler = h; },
		async close() { calls.push("page.close"); },
		async fire(method, url, postData) {
			const route = {
				request: () => ({ method: () => method, url: () => url, postData: () => postData }),
				fulfill: async (r) => calls.push({ op: "fulfill", url, status: r.status }),
				continue: async () => calls.push({ op: "continue", url, method }),
				abort: async () => calls.push({ op: "abort", url, method }),
			};
			await handler(route);
			return route;
		},
	};
	return page;
}

async function selfTest() {
	const dir = mkdtempSync(join(tmpdir(), "cg-"));
	let failed = 0;
	const t = (name, ok, detail = "") => { if (!ok) { failed++; console.error(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}`); };
	try {
		const base = "http://localhost:5173";
		const rpc = (p) => `${base}/rpc/${p}`;
		const prefix = { readVerbs: PREFIX_READ_VERBS };
		t("default: a read-looking name is denied until listed", !classifyName("files/getFile").read && classifyName("files/getFile", { readProcedures: ["files/getFile"] }).read);
		t("default: users/me aborted until listed", decide({ method: "POST", url: rpc("users/me") }, {}).action === "abort");
		t("default: a listed last segment continues", decide({ method: "POST", url: rpc("users/me") }, { readProcedures: ["me"] }).action === "continue");
		// A regex for "file" once matched fileUrl, so a state was never captured.
		t("tokens split camelCase", JSON.stringify(tokens("fileUrl")) === '["file","url"]' && JSON.stringify(tokens("getFile")) === '["get","file"]');
		t("prefix: getFile is a read", classifyName("files/getFile", prefix).read);
		t("prefix: fileUrl is not matched by a file prefix", !classifyName("files/fileUrl", prefix).read);
		const d1 = decide({ method: "POST", url: rpc("files/fileUrl") }, prefix);
		t("fileUrl aborted with a way out named", d1.action === "abort" && /readProcedures/.test(d1.reason), JSON.stringify(d1));
		const d2 = decide({ method: "POST", url: rpc("files/fileUrl") }, { readProcedures: ["files/fileUrl"] });
		t("fileUrl continues once listed", d2.action === "continue", JSON.stringify(d2));
		const d2b = decide({ method: "POST", url: rpc("files/fileUrl") }, { fixtures: { fileUrl: { body: { url: "x" } } } });
		t("fileUrl fulfilled from a fixture", d2b.action === "fulfill" && d2b.response.status === 200);
		// A leaked updateRecord once changed real data.
		const d3 = decide({ method: "POST", url: rpc("billing/updateRecord"), postData: "{}" }, prefix);
		t("prefix: updateRecord aborted", d3.action === "abort", JSON.stringify(d3));
		t("prefix: getOrCreate is not a read", !classifyName("orgs/getOrCreate", prefix).read);
		t("prefix: listUpdates is a read (plural is not a write token)", classifyName("feed/listUpdates", prefix).read);
		t("prefix: cases/listAdmin is a read", decide({ method: "POST", url: rpc("cases/listAdmin") }, prefix).action === "continue");
		t("prefix: users/me is a read", decide({ method: "POST", url: rpc("users/me") }, prefix).action === "continue");
		t("rest style aborts POST reads", decide({ method: "POST", url: rpc("cases/list") }, { procedureStyle: "rest" }).action === "abort");
		t("PUT aborted", decide({ method: "PUT", url: `${base}/api/x` }, {}).action === "abort");
		t("GET to app continues", decide({ method: "GET", url: `${base}/assets/app.js` }, {}).action === "continue");
		t("non-localhost aborted", decide({ method: "GET", url: "https://api.stripe.com/v1/x" }, {}).action === "abort");
		t("lookalike host aborted", decide({ method: "GET", url: "http://localhost.evil.com/x" }, {}).action === "abort");
		const writes = ["POST " + rpc("billing/updateRecord"), "PUT " + base + "/api/x", "POST " + rpc("cases/listAdmin")];
		t("prove names a write the prefix verbs let through", prove(writes, prefix).length === 1);
		t("prove is clean by default", prove(writes, { readProcedures: ["users/me"] }).length === 0);
		t("bad procedureStyle throws", (() => { try { decide({ method: "GET", url: base }, { procedureStyle: "x" }); return false; } catch { return true; } })());

		// installGuard against a fake page. A held write is aborted at close, not released.
		const logFile = join(dir, "guard.log");
		const page = fakePage();
		const guard = installGuard(page, { logFile, hold: ["cases/update", "cases/listAdmin"], fixtures: { "users/me": { body: { id: "u1" } } } });
		await guard.ready;
		await page.fire("GET", `${base}/`);
		await page.fire("POST", rpc("users/me"));
		await page.fire("POST", rpc("cases/update"), "{}");
		await page.fire("POST", rpc("cases/listAdmin"));
		await page.fire("POST", rpc("billing/updateRecord"), "{}");
		await page.fire("GET", "https://example.com/pixel.gif");
		t("two routes held", guard.heldCount() === 2, String(guard.heldCount()));
		t("nothing continued for the held write", !page.calls.some((c) => c.op === "continue" && /cases\/update/.test(c.url)));
		await guard.closePage(page);
		const ops = page.calls.map((c) => (typeof c === "string" ? c : `${c.op}:${c.url.split("/").slice(-2).join("/")}`));
		const closeAt = ops.indexOf("page.close");
		t("held write aborted before page close", ops.indexOf("abort:cases/update") > -1 && ops.indexOf("abort:cases/update") < closeAt, ops.join(" | "));
		t("held read aborted too, never released", ops.indexOf("abort:cases/listAdmin") > -1 && !ops.includes("continue:cases/listAdmin"));
		t("updateRecord never continued", !ops.includes("continue:billing/updateRecord") && ops.includes("abort:billing/updateRecord"));
		t("non-local aborted in the page", ops.includes("abort:example.com/pixel.gif") || ops.some((o) => o.startsWith("abort:") && o.includes("pixel.gif")));
		t("users/me fulfilled", ops.includes("fulfill:users/me"));
		const lines = readFileSync(logFile, "utf8").trim().split("\n").map((l) => JSON.parse(l));
		t("guard.log has one JSON line per decision", lines.length >= 8 && lines.every((l) => l.action && l.url && l.t), String(lines.length));
		t("no continue of any write in the log", !lines.some((l) => l.action === "continue" && /updateRecord|cases\/update/.test(l.url)));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
	if (failed) { console.error(`${failed} self-test failure(s)`); process.exit(1); }
	console.log("all as expected");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const o = parse(process.argv.slice(2));
	if (o.help) console.log(HELP);
	else if (o.selfTest) await selfTest();
	else if (o._[0] === "names") {
		for (const n of o._.slice(1)) {
			const c = classifyName(n, o);
			console.log(`${c.read ? "read" : "deny"}\t${n}\t${c.why}`);
		}
	} else if (o._[0] === "decide") {
		if (!o.url) { console.error("decide needs --url"); process.exit(2); }
		console.log(JSON.stringify(decide({ method: o.method || "GET", url: o.url, postData: o.body }, o)));
	} else if (o._[0] === "prove") {
		if (!o.writes) { console.error("prove needs --writes <file>"); process.exit(2); }
		const leaks = prove(readFileSync(o.writes, "utf8").split("\n"), o);
		for (const l of leaks) console.log(`LEAK\t${l.method} ${l.url}\t${l.reason}`);
		console.log(leaks.length ? `${leaks.length} writes would reach the backend` : "every write is blocked");
		process.exitCode = leaks.length ? 1 : 0;
	} else { console.error("usage: capture-guard.mjs names|decide|prove|--self-test|--help"); process.exit(2); }
}
