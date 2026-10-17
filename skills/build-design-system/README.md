# build-design-system

Turns an app's UI into a design system that people and agents can use. It has three modes. Build extracts a system from an app that has none. Harden fills in components that exist without states or rules. Seed starts a system for a new app from brand material or a stock preset. Each mode reads a base reference for the app's foundation: a copy-in component registry such as shadcn, a package library, the team's own package, or hand-rolled code.

It inventories the real routes, components and values with scripts and captures every screen before touching anything. Then it writes semantic tokens in the format the foundation reads, picks one canonical component per family with a spec answered from the app's own evidence, and generates docs with Markdown twins and `llms.txt`. The check it copies into the repo keeps the system enforced after the run (`references/checks.md`). Everything lands on a run branch, one surface per commit with before and after captures, and the merge is yours. A run ends check-first: tokens, one component per family, the pilot on the system, docs, a ratcheting CI check and an AGENTS.md index, with a ranked list of what it found and did not fix. Migrating every other screen is a separate ask.

It uses three sibling skills: `token-mapping` to fold existing values into the new tokens, `component-docs` for each component page, and `ui-review` for the pilot. Install all four together.

## Use as-is

Run `npx skills@latest add arla6ka/design.how` to install it with its sibling skills. To install by hand, copy the folder to `.agents/skills/build-design-system/` in your repo, which most agents read directly, or link it into `.claude/skills/` for Claude Code. Then ask your agent for one phase, such as "extract tokens from the app" or "add states and specs to our components". A whole-app ask like "set up a design system" goes to `design-system-boss` when it is installed, which calls this skill. A loose request is fine. The skill finds the run command, picks a pilot and a budget, states them in one message and starts reading the repo while you check them. An agent may pick it without being named, which is safe because the first two phases only read, and every write lands on a run branch you merge or drop.

It works on any web stack it can read and run, and its specs are framework-agnostic, though some examples and the component scan assume JSX. It assumes file access, a shell, Node 18 or later for the scripts, and a command that starts the app. A browser and subagents are optional. Without a browser, the run stops before the pilot.

## Replace first

1. The page list and URL root in `references/system-structure.md`, which follows Geist. Drop foundations and pages your app does not need. Keep the nine component page sections and their order, because `component-docs` and `migrate-design-system` read them.
2. The token naming groups in `references/token-architecture.md`, if your team already has a vocabulary. Keep the layer rules.
3. The inventory commands in `references/inventory.md`, for your folders, file types and router.
4. The canonical-pick order and accessibility floor in `references/component-contract.md`, to match your behavior library and test runner.
5. The base reference for your foundation (`references/base-shadcn.md`, `base-library.md`, `base-raw.md`), with your registry namespace, theme file and wrapper folder.
6. The worked spec in `references/spec-example-combobox.md`, with one of your own once it passes the check. Add your team's behavior traps to `references/traps.md`. Add questions or principle kinds to `references/rule-method.md` when your product has a concern it misses, and keep the rule shape and the four tests.
7. A precedence rule in AGENTS.md or CLAUDE.md for tokens that live in two places. Without one, each conflict becomes a gate.
8. Tolerances in `token-mapping`'s rules file. This skill merges values inside them without asking.
9. The rules in `references/checks.md` and `scripts/check-system.mjs`, for your lint setup and ui folder. Keep the drift-list hashes, the allowlist and a fixture pair per rule.

## Invariants

Change one only when its stated reason doesn't apply to you.

- Screenshots before the first edit. Without them, nobody can tell an intended change from a regression.
- Scripts produce every count so the handoff can rerun them. Counts read by eye miss re-exports and aliases.
- No new visual direction unless you chose one. The system describes the app you have. A new look lands only when you picked it in the design-source question, in place or in a new folder.
- Gates with defaults, not questions that stop work. A run that waits on a naming answer for a day produces nothing, so an unanswered gate takes its default and the handoff lists it first.
- One writer per shared file. The token source belongs to the one writer `references/coordinator-path.md` names, and the registry, barrel and migration map to the coordinator. Workers report requests.
- Generated docs. A hand-written twin drifts on the first change, and agents trust it anyway.
- The repo works after the run. Scripts, config, allowlist, specs and docs live in the repo. A check that reads from `.design-system/` or a skill folder breaks the day either is gone.
- One page skeleton for every component. Agents learn where Props and States sit once, and the docs check can test it.
- Specs answered from the app. A spec copied from a reference system describes someone else's product, and the rules it carries are their taste.
- The foundation's files stay the foundation's. A generator that owns the foundation's token file, or a rewrite of a stock component, breaks the next upstream update.
- Every check is seen failing once, and the full check exits 0 at handoff. A check that never failed may not check anything, and a red one teaches every later agent to ignore it.
- One pilot, then only safe token moves and cleared surfaces, one per commit, on the run branch. Nothing lands on your branch until you merge, and an unexplained diff becomes a gate instead of a commit.

## Optional tools

- A browser for captures (`scripts/capture.mjs`, every route, width, theme and state in one command), diffs (`scripts/pixdiff.mjs`) and one-off evidence. `references/browser.md` names the tools and how the scripts find a browser. Without one, the run stops before the pilot and reports code-complete, not runtime-verified.
- `ast-grep` for component definitions and inline styles. Without it, the `rg` fallbacks work and miss a few forms.
- Subagents or separate agent sessions on their own branches, for phase 4. Without them, the same briefs run one after another.
- A second model for reviewing worker output where judgment matters, such as accessibility and API shape.

## What the scripts touch

Read these before you install. No script sends data anywhere except to the app URL you give it.

- `check-system.mjs`, `check-spec.mjs`, `copy-check.mjs`, `gen-docs.mjs`, `props-table.mjs` and `check-record.mjs` read the repo. The check writes only its config, allowlist, ratchet file, drift list and stock copies under `scripts/`, when you pass a flag that says so. `gen-docs.mjs` writes the twins and indexes under `public/`, its own config, the index region in AGENTS.md and `docs/system/changelog.md`, and `copy-check.mjs --extract` writes `docs/system/copy-inventory.tsv`. They run `git` to find the repo root and changed lines.
- `capture.mjs`, `probe.mjs`, `pixdiff.mjs`, `montage.mjs`, `stress.mjs`, `state-timeline.js` and `check-docs-leak.mjs` launch a local Chromium through Playwright (`find-chromium.mjs` finds it, and runs `npm root -g` to look for a global install) and load only the URL or fixtures you pass. They write captures, JSON results and a review page where `--out` or `--json` points, and `capture.mjs --eval` writes one JSON file per capture. `capture.mjs --via` and `check-docs-leak.mjs` shell out to `agent-browser`.
- `oklch.mjs` and `optical.js` compute only. `optical.js` runs inside a page you open.

## Check after changing

Run the cases in `TESTS.md` per `../TESTING.md`. At minimum, run Missing required input, Enforcement proves itself and Scope creep.

## Adapt this skill

Use the interview prompt in `../ADAPTING.md` with this folder attached. Topics for this skill: where shared UI lives, with the framework, styling method and router; any token file or theme config other tools read; the docs site and the URL shape for system pages; the words for token roles and variants; the behavior library and test runner; the viewports and themes you ship; the screens you consider the app's best; which source wins when two token files disagree; and who confirms gates, and how fast.
