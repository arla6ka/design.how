# design-system-boss

One entry skill for the other five. Say something vague, like "our UI is a mess, fix it", and it runs a triage script over the repo. The script works out the foundation (shadcn, a package library, the team's own package, or hand-rolled code), whether a system exists, whether one is already installed from a registry with its own skill, whether the repo is a design system itself, whether it has specs, and whether the code follows it. Then the boss picks a route: seed a new system, build one from the app, harden a weak one, migrate, port onto an installed system, map values, document, review or audit. It runs each step through the sibling that owns it, with subagents where the host has them, and keeps one state file a new session can resume from. Its final message is a report built from files: one sentence that answers the ask with numbers, which screens changed, each check with its exit code, the gates that matter most, and the next step as a prompt, usually a merge.

It never writes product code when it can spawn subagents, never invents brand values, never commits to a branch you did not name for the work, never pushes unasked, and never migrates past the decided defaults without clearance. Only an ask that names the migration, such as "move every screen", gives it. "Clean the app up" ends check-first: tokens, one component per family, the pilot, docs, a CI check that warns on new drift, and a ranked list of what it found and left, with the migration offered as the next step.

## What the scripts touch

The one script is `scripts/triage.sh`.

- Reads files git tracks or would track in the repo, plus `package.json` and `components.json`.
- Writes only into its output folder, `.design-system/boss/triage/` by default.
- Network: none by default. With `TRIAGE_SHADCN_INFO=npx` it runs `npx shadcn@latest info`, which may download the package.
- Shell: runs `rg`, `find`, `awk`, `perl`, `node` and read-only `git` commands, and the repo's own `node_modules/.bin/shadcn info` when that exists. `TRIAGE_SHADCN_INFO=0` skips it.

The boss itself runs the sibling skills' scripts through its workers, and their READMEs list what those touch.

## Use as-is

Install it with its siblings: `npx skills@latest add arla6ka/design.how`. By hand, copy the folder next to the other five in `.agents/skills/`, or `.claude/skills/` for Claude Code. Then say what you want in your own words. The boss reads the repo before it asks anything. It asks at most one routing question, plus your bans and how closely to follow a design source, each with a default already applied.

Agents often skip an installed skill when the ask does not name it. If yours do, add load conditions to AGENTS.md that name the work, not the skill's topic:

```markdown
Load the design-system-boss skill before you: build, harden or document a design system; move
screens onto shared components; replace hardcoded colors or spacing across more than one file;
or answer "how consistent is our UI".
```

It needs file access, a shell and `rg` (ripgrep). A browser and subagents are optional. Without subagents every step runs in sequence, and without a browser the build stops before its pilot and review steps are skipped. The model may invoke it unasked, because the asks it serves never name a skill, and that is safe because triage only reads and every write lands on a run branch only you merge.

## Replace first

1. The state thresholds in `references/triage.md`, such as the adoption share under which an app counts as drifting. Measure your own app before trusting them.
2. The intent words in `references/triage.md`, if your team says "tokenize" where the table says "use our tokens".
3. The search globs in `scripts/triage.sh` for your folders and file types, and its list of stock file names if your registry adds its own.
4. The phase caps in `references/routes.md`, once a few runs tell you where the time goes on your app.
5. Project rules for the standing orders, in AGENTS.md or CLAUDE.md. The boss passes them into every brief.

## Invariants

Change one only when its stated reason doesn't apply to you.

- Triage by script. A route chosen from the prompt's wording alone sends a "fix it" ask to whichever skill's description sounded closest.
- One routing question, with a default, and the standing questions answered by defaults until you reply. Work starts under the defaults, so no answer blocks it. A run nobody answers records each as `default (unanswered)` and lists them first in the report.
- The boss never writes product code when it can spawn subagents. Once it starts editing, it stops reading returns, and every step behind it waits. On a host without subagents it takes a sibling's seat and follows that sibling's rules.
- No worker outlives the boss. A worker left running keeps writing into a repo nobody checks.
- One writing step at a time. Build and migrate touching the same files at once produce two versions of each.
- Every writing run works on its own branch, or on the one you named for the work, and merging it is the person's call. Every decided gate default lands there with captures, so the next step is a merge. Migration beyond those defaults needs clearance, a budget from a person or an ask that names the migration.
- Verdicts from files. A sibling's summary is a claim until its check command runs again.
- One state file, one writer. The boss's context will be lost, and the next agent has only the file.

## Check after changing

Run `TESTS.md`. At minimum, run Vague build ask to confirm triage comes first, Migration clearance to confirm no editing starts without a reply, and Unrelated work to confirm a dirty tree is left alone. Then run `scripts/triage.sh --self-test`, which must end `all as expected`, and run the script on your own repo twice and confirm the output does not change. If you use shadcn, also run it on a fresh project with every stock component added, and confirm `families_with_2plus` is 0.

## Adapt this skill

Use the interview prompt in `../ADAPTING.md` with this folder and the five sibling folders attached. Topics for this skill: how your team words design system asks, so the intent table matches; what adoption level counts as settled and how many duplicate families you tolerate; where tokens, shared components and docs live, for `triage.sh`; how much time and how many agents a run may use; who clears a migration; and what your agent host can do (subagents, nesting, worktrees, a browser). Leave the routing table's order, the one-question rule, the clearance step and the never list alone unless an answer contradicts one.
