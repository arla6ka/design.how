# Coordinator path

The one page a coordinator reads to run the build, whether this skill's own or design-system-boss. Open another reference only when the phase that names it starts. Terms such as run branch, surface, gate, clearance and `<skills>` are defined in `run-record.md` (Terms).

A coordinator that is itself a subagent, such as a build step under design-system-boss, spawns its workers as foreground calls, several in one message when they should run side by side. It never ends its turn with a background worker live, because the host orphans or kills that worker when the coordinator hands back.

## Start

1. Pick the run branch. When the checkout holds uncommitted changes or sits on a branch someone else works on, a run that writes asks the person which branch to use, with the default applied. The default is the run branch in its own worktree cut from HEAD (`git worktree add .design-system/tmp/run -b ds/<yyyy-mm-dd>-<route>`), so the checkout and its branch stay as found. It never stashes, and an unanswered question stays `default (unanswered)`. When the person named a branch for this work, in this session or in saved memory, or said "work on my current branch", use it and create no other. Otherwise create one from the current HEAD: `git switch -c ds/<yyyy-mm-dd>-<route>`, where the route is the mode (`build`, `harden`, `seed`) or the one the boss names, and never commit to the starting branch. Write the branch and the rule used into the Frame. Nothing is pushed unless the person asks.
2. Create `.design-system/run.md` from `run-record.md`, with the Frame, the standing orders and the known gates. Workers read gates, so the gates exist before any worker starts.
3. Decide the footprint. When the repo looks like one the person does not own (a remote that is not theirs, a CONTRIBUTING.md, a README for outside contributors), or the ask mentions a PR or upstream, open a footprint gate with the default "minimal" (`run-record.md`, Terms). Phases 5 and 7 then write only what the repo's own lint and docs already hold. When the ask names families, minimal covers only those, and no migrate audit plan is written. Before editing an instance, confirm something imports it.
4. Set up for the footprint. Full: copy into `scripts/` only what the repo's check runs (`check-system.mjs`, `check-spec.mjs`, `gen-docs.mjs`, `props-table.mjs`, `copy-check.mjs`), copy `spec-template.md` to `docs/system/`, run `node scripts/check-system.mjs --init`, and add `.design-system/review/**/*.png` and `.design-system/tmp/` to `.gitignore`. Everything else in `.design-system/review/` is a committed record: `surfaces.tsv`, `traces.tsv`, the probe files, the review reports and `index.html`. Nothing in `package.json` reads from `.design-system/` or a skill folder. Minimal: copy nothing, leave `.gitignore` alone, and list `.design-system/` in `.git/info/exclude`. Either way, capture, pixdiff and montage run from `<skills>/build-design-system/scripts/`.

## Small app

An app is small when `routes.tsv` holds 8 routes or fewer and the UI code is under 3,000 lines (`wc -l` over the markup and style files in the include folders, minus the Excluded paths in `inventory.md`). Under design-system-boss, triage's `small_app` signal decides it. On a small app one coordinator runs every phase itself, with no fan-out. It opens only the references for the steps it runs, and records the two-agent tests and the review lenses as `skipped (small app)`. The captures, the check, the gates and the pilot still run.

## Phase caps

The budget is what the person named, else the session the host gives, else 2 hours, which fits one pilot and a first pass of surfaces. Under design-system-boss, the build uses the caps in the boss's brief and skips the shares below. At a cap, record what is left as found-not-fixed rows and move on. Refill a worker slot only when no report waits for review. Stop spawning at 70% of the session by default, so the rest covers review, the check and the close.

The shares are defaults. Move time only with a Frame line naming both phases and why.

| Phase | Cap | Read when it starts | Cut first at the cap |
|---|---|---|---|
| 1 Frame and setup | 5% | `run-record.md` (Frame, Standing orders), the base reference | nothing |
| 2 Inventory and baselines | 10% | `inventory.md`, `browser.md` (Capture every route in one command, Measuring a loading state). Measure every pilot trap's before state here and save the numbers in `run.md`, since the first edit erases it | screen notes past the pilot |
| 3 Foundations | 15% | `token-architecture.md` or the base reference | swaps on a route that fails pixdiff go to the map |
| 4 Components | 15% | `component-contract.md`, `traps.md`, `worker-brief.md`, `rule-method.md`, `stress-test.md` | families past the pilot's, each with a gate naming its missing states |
| 5 Checks | 10% | `checks.md` | never cut. Hits past the cap go to the allowlist |
| 6 Pilot | 10% | `browser.md` (Compare after a change, Measuring a loading state) | never cut |
| 6 Safe moves, then cleared surfaces | 20% | "Clearance" and "Surfaces on the run branch" below | cleared surfaces go in Next, by name. Safe moves never |
| 7 Docs | 10% | `system-structure.md`, `spec-template.md`, `writing-method.md`, "Review, decide, fix" below, and "Document everything" when the ask names it | the HTML docs site, then families past the pilot's. Generated docs and the review never |
| 8 Handoff | 5% | `run-record.md` (Handoff report) | nothing |

The safe moves (Clearance) take this share first and never wait for clearance. With no clearance, what is left goes to components and docs. Landing safe moves is exempt from the spawn stop, because it is cheap and it is what makes screens change. The live showcase the person reviews in is never cut, and neither are the rules of a family that landed, the pilot, the check, the AGENTS.md block or the generated docs.

## Machine budget

This sets the most workers in flight for every design.how skill. Each worker kind's window starts at its own row, the browser row caps browser workers, and no window grows past this table. It is sized by what workers run, since a dev stack, a browser and four compiling workers on one machine can run out of memory and crash the host.

| Worker kind | What it runs | Default in flight |
|---|---|---|
| Read-only | reads files, returns a report | 6 |
| Docs writer | edits Markdown, runs the formatter and scans | 5 |
| Code worker | edits code, runs typecheck and tests | 2 |
| Browser worker | code plus a browser tab and measurements | 2, sharing one browser |

Before the first fan-out, and after any crash:

1. Read memory pressure: the free percentage from `memory_pressure -Q` on macOS, or available over total from `free -m` on Linux. Below 10% free, run one worker at a time. Otherwise use the windows above. Swap does not count, since macOS rarely gives it back. The window never drops to zero. With a subagent tool, at least one worker runs at a time, so a coordinator that delegates all product code always can.
2. Stop every service the work does not need, such as a backend when only the showcase is reviewed, and name them in the Frame.
3. Give each expensive command one lock, and put the locked form in every brief, such as `flock <lock file> <typecheck command>`. Workers typecheck once near the end and run tests only for their files.

Record the reading and the window as a decision row, and recheck before each wave. After a crash, cut the code and browser rows first. When the person asks for more parallel work, widen the docs row first.

## Dev server and retries

- Only the coordinator starts the shared dev server and the shared browser session. It names the port in every brief and keeps the server up until every worker has returned. The scripts' own headless launches (capture, probe, pixdiff, montage) are exempt.
- A worker in its own worktree may start its own server on port base+n when the shared one does not answer, and stops it when it finishes. A worker in a shared checkout starts nothing and returns `blocked: server down`. The coordinator restarts the server and resends the same brief.
- The migrate verifier always runs its own server in its own worktree, because it checks out a surface commit the shared server does not serve.
- A failed worker gets one retry, a fresh brief with the failing output pasted in. After a second failure the unit splits into smaller briefs or becomes a gate. On a direct build run the coordinator may take the family over itself instead. Under design-system-boss it writes no product code, so it gates.
- When the same cause fails two units, stop refilling slots for that cause. Fix it in the brief, the contract or the reference implementation, then resend.
- A finding two or more workers report as not theirs becomes a coordinator task. After each wave, regenerate every generated file before the next wave reads it.
- A running worker gets a message only per `worker-brief.md` (Retries and dropouts). Before relaunching a step that looks missing, list the live agents. Hand a file to write only to an agent that can write files.

## Lock before fan-out

A worker writes against the brief it gets today. One writer owns the token source and the first family: the coordinator on a direct run. Under design-system-boss, which writes no product code, it depends on the host. On a flat host the boss names the one writer. On a nested host the build step agent is the coordinator and writes it. Each item below changes every file a family touches, so it is settled, written into the repo and shown to the person before the first family worker starts. Changing one after fan-out is a migration of every file already written, with its own check, never a note in the next brief.

| Settle | Where it lives | Shown to the person as |
|---|---|---|
| The run branch and what stays local | the Frame | one line in the plan |
| The person's bans | the standing orders, the writing page and `bans` in the check config | the plan's bans line |
| How closely to follow a design source, and in place or in a new folder | the Frame, then the sample (`modes.md`) | the sample beside the source |
| Conflicts between named sources, and between a source and the bans (`modes.md`, What decides a question) | numbered rows in `docs/system/decisions.md` | one question per conflict |
| The alignment reference per context: cap center, x-height center or the midpoint, with the typeface named | a numbered row in `docs/system/decisions.md` | zoomed crops of two real instances with each candidate line drawn (`browser.md`, Measuring optical alignment) |
| The spec format and the rule shape | `docs/system/spec-template.md` and the first family's spec | that family's page |
| The API vocabulary (`component-contract.md`, API) | `docs/system/decisions.md` | one decision line |
| The icon set, its sizes and its alignment rule | the brand page and the icon component | the icon row on the first family's page |
| Motion presets | the token source and the motion page | a replayable demo per preset |
| The showcase shape, when the person reviews in a browser | the showcase shell and its registry | the first family's page |
| How a new page, export or doc is picked up | a registry that finds files, or a generated index | nothing. Workers never edit it |

On a whole-system run, phase 2 fans out one read-only worker per product area and one per source the person named (`inventory.md`, Surface map and research). The spec check and the ban scan run from phase 1, so workers' output passes them before phase 5.

## Clearance

A writing run ends check-first (`SKILL.md`, Done). Outside the pilot, three safe moves land with no clearance, one surface per commit as the next section says:

- identical-value swaps (`run-record.md`, Terms)
- merges inside `token-mapping`'s tolerance, which are decisions
- decided gate defaults, including a merge past tolerance, which is a gate whose default is the merge

When the ask is visual consistency, a small outlier, such as a single off-brand 404 page, moves to the system as a decided default, not a gate. In harden mode and on the boss's Full route, horizontal overflow at the narrow width in shared layout (the shell, the nav, a layout every route renders) is a decided default too, with `document.documentElement.scrollWidth` at that width before and after in its trace row.

Anything else outside the pilot, such as moving a screen's markup onto canonical components, is migration. It needs clearance, which is surfaces or a budget the person names, or an ask that names the migration (`run-record.md`, Terms). Without it, the rest goes on the found-not-fixed list, and Next offers the migration with its size from `close.md`: the surfaces left and the drifted values on them.

## Surfaces on the run branch

A visible change lands on the run branch when it traces to a gate or decision and its surface has captures. The review records are committed (Start), so the review page travels with the branch.

1. Order the surfaces: the one the complaint names, then `high` tier before the rest, then by how many drifted values each holds. Every route is a row in `.design-system/review/surfaces.tsv` (`inventory.md`, Baseline screenshots), and the phase 2 before captures came from it.
2. One surface per commit. Apply the gate defaults and the migration map, with the codemod when one exists. Read every hunk before committing.
3. After a shared UI or token edit, `node <skills>/build-design-system/scripts/capture.mjs --base <url> --status --surfaces .design-system/review/surfaces.tsv` must show 200 on every route, or the status its row expects. When the dev server may serve stale styles after a global style edit, restart it first (`browser.md`).
4. Capture after with one command. Copy the surface's row into `.design-system/tmp/<worker id>/<surface>.surfaces.tsv` (`run-record.md`, Terms) and run `node <skills>/build-design-system/scripts/capture.mjs --base <url> --kind after --out .design-system/review --surfaces .design-system/tmp/<worker id>/<surface>.surfaces.tsv --states <file.mjs>`, so every listed state is recaptured along with the load state. Add the surface's row to `.design-system/review/traces.tsv`: surface, commit hashes, gate and decision ids, and what changed in plain words, including every line of its behavior delta. A state the run adds has no before: list it in `surfaces.tsv` and capture it after. A shared shell change that touches every route is one row with the surface `shared`.
5. Run `node <skills>/build-design-system/scripts/montage.mjs --diff` and `node scripts/check-system.mjs --files <the surface's files>`. The montage exits 1 on any change no trace row or gate explains, and on the rendered problems `montage.mjs --help` lists, such as recolored text under its contrast floor or a nav link newly hidden at the narrow width with no gate id (`traps.md`, `trap/narrow-hidden-nav`). Fix it, or take the change off the branch and open a gate. A finding that waits on a person may stay on the branch under an open gate: add a row to `.design-system/review/open-gates.tsv` (gate, surface, text the finding contains) and name the gate in the trace row. The montage then lists it as a warning. Once the surface lands, run `node scripts/check-system.mjs --shrink-allowlist` and commit the allowlist on its own. Workers only report shrink candidates.
6. A fix to broken behavior is a decision. An intentional behavior change is a gate, applied by default like any other. Accessibility-tree changes sort by `traps.md` (Adds-only accessibility changes). Link restyles are one gate listing every surface they touch (`SKILL.md`, Boundaries).
7. When `migrate-design-system` is installed, it runs this loop and the build hands it the map. Merging into the person's branch is always the person's call.

## Components close

Phase 4 closes only when every family in scope has its missing states built or gated. In scope means every family the inventory or the harden gap list marks with missing states, not only the pilot's. A family cut at the cap gets a gate naming each missing state, such as "Table: empty, loading, error. Default: build them on the next surface that lists records". A prop the run removes from a component is a gate listing its call sites, even when no call site uses it today. To find them, compare `props-table.mjs` on each component file the run edited, at the starting commit (a worktree in `.design-system/tmp/`) and at HEAD. The handoff lists every family in scope as built, or as a found-not-fixed row with its gate id.

Before it closes, one browser worker runs the optical pass on every showcase page (`browser.md`, Measuring optical alignment), and the stress test runs per family group (`stress-test.md`). Every break either lands as a fix or a Limits rule, or becomes a gate.

## Document everything

By default, specs cover the pilot's families, and build adds the families the strays touch. The run specs every family in the inventory when the ask says complete, full, all or every component ("document all our components"), or when the pilot's specs close with budget left before the docs cap.

1. List every canonical row in `components.tsv` by family. Families the pilot touched go first, then the rest by call-site count, highest first.
2. Write `docs/system/writing.md` first, per `writing-method.md`, so every spec's Content cites it instead of deriving voice on its own.
3. Fan out one spec worker per family, with the spec-worker variant in `worker-brief.md` and `rule-method.md`, in the rolling window. A family whose code still needs work gets the family template instead.
4. Review each report as usual. Also open its `rule-tests` file and rerun one two-agent test on an Anti-slop or Limits rule yourself.
5. At the docs cap, stop starting families. Each family not reached is one found-not-fixed row naming its members and call-site counts.

## Review, decide, fix

Scopes stop two writers from touching one file, not from answering one question two ways on two pages. So after any fan-out of more than three writers, and again before the handoff, the run reviews itself, settles each conflict once, then fixes every side.

1. **Review.** Read-only workers side by side, one lens each, each writing `.design-system/review/lens-<name>.md` with the commit it read on its first line, a count table, then findings by topic, worst first. Every finding gives each side's `path:line` with a short quote, a kind (`conflict`, `wrong`, `stale`, `missing`, `nit`), a severity (`blocking`, `should-fix`, `note`), its evidence type (`seen`, `measured` or `inferred`, as `ui-review` uses them), a dedupe key `<criterion number or trap/rule ID>|<element role and name, or region>`, and a proposed answer by the precedence below.
   - Cross-page conflicts: the same topic answered two ways, such as durations, sizes, item limits, prop and tone names, the disabled pattern, empty values, or which component does a job. Also "use X instead" that points at nothing, and duplicate or dangling rule IDs.
   - Specs against code: every prop, default, constant, token, key and ARIA claim a spec makes holds at HEAD.
   - Format and bans: headings, the rule shape, counts, sources, and every ban in prose, tables and examples outside `Don't:` lines.
   - Showcase against rules: the showcase obeys the rules it shows, since agents copy it.
   - Newcomer: one agent builds one real screen on a real route from the docs alone, logs each place it got stuck, then restores the repo.
   - Polish: every overlay open, at every width and theme. It can run as `ui-review`.
2. **Decide.** The lenses merge into one ledger by dedupe key, and each finding ends `done` (fixed), `skipped (<reason>)`, or on the found-not-fixed list. An `inferred` finding is confirmed before it enters a fix brief. The coordinator writes one numbered decision per conflict in `docs/system/decisions.md`, committed, never only in the run record, since agents in later sessions read the repo. A rename of a prop, tone or token is a decision too, so every fix worker writes against the new name at once. A decision that changes every instance lists its consumers, and the fix sweeps them with named opt-outs, never as a silent global change. Mark findings on files that changed since a lens's commit as stale. No message to the person says done before the lenses have run.
3. **Fix.** One worker per ownership set, side by side, each reading the decisions first and its lens findings second: code (the component folder, tokens, utility config), foundation and writing pages, specs split by an explicit file list, and the showcase. Docs workers never compile. The code worker lists every call site its renames break, with file and line, for the showcase worker. Then regenerate the indexes, run every check, capture every page the fix touched in both themes, and commit per worker.

The decisions page opens with its precedence: the person's direct words, then this page, then the foundation pages, then the specs, then the code. It also holds the conflicts between sources that `modes.md` (What decides a question) settles before any writer starts. To change a decision, edit it here and fix every page and component it names in the same change. One line per decision:

```markdown
- D12 Menus: open and close instantly, with no fade. Menu, Select and Combobox pages say so, and their components use the `instant` motion preset. Overrides the dialog page, which is a different surface.
```

## Sibling skills under this coordinator

Under this coordinator, `component-docs` and `ui-review` return text and write no file. The coordinator saves a component entry to `docs/system/<component>.md` and a review to `.design-system/review/<surface>-review.md`. Run directly, each saves to its own default path. A cheap CSS fix a review finding names, such as an overflow at the narrow width or a control height off the scale, lands on the run branch as a decision when existing tokens cover it, with captures and a trace row like any surface. It is not a follow-up.

## Close

1. Run the full check on a clean clone and the repo's production build. Then start the production server and run `capture.mjs --status` against it. A route that answers 200 in dev and fails in production is a failed run.
2. Run `node scripts/check-system.mjs --prune-allowlist`, which drops every allowlist entry the run fixed, and commit the allowlist. Then write the close numbers to one file, `.design-system/close.md`: the output of `node scripts/check-system.mjs --no-self-test --left`, then the montage's output with every warning on an open gate listed by gate id, then the inventory rerun by route. Every count in the final message comes from this file and nowhere else. `node <skills>/build-design-system/scripts/check-record.mjs` must exit 0 on the run record before the handoff. Under design-system-boss the boss rewrites this file at its own close and keeps the build's rows.
3. The final message is the handoff report, in the format `run-record.md` gives (Handoff report).

Done also needs these, beyond `SKILL.md`:

- A generator run twice leaves no diff. `node scripts/gen-docs.mjs --check` exits 0, and the AGENTS.md block names the generated docs and the check command.
- Build and harden: every inventory row is canonical, merged, deleted or kept as a product composition. The handoff names the migration map, the codemod or why there is none, and counts by route. Harden adds `strays.tsv`.
- Build specs the families the strays touch. Harden and seed list the rest as found-not-fixed rows, unless the ask wants complete docs (Document everything).
- Existing violations sit in a committed allowlist. Every trap in the pilot's files is fixed or gated with its measurement, and `check-system.mjs --files <pilot files>` exits 0. The allowlist holds nothing there except a one-off value a decision row names (`checks.md`, The allowlist).
- The CI tiers in `checks.md` are set up, the ratchet file is committed, and `gen-docs.mjs` has written the AGENTS.md index and `docs/system/changelog.md`.
- Outside the pilot and the system's own files, the run branch holds only the safe moves (Clearance), the root token import and cleared surfaces, each surface one commit with a `traces.tsv` row and a montage that exits 0. Every gate names its default, and the branch applies it.
- Seed has no before captures, says so, and names the next screen.

### Minimal footprint

On a minimal footprint the check is the repo's own lint, typecheck and build on a clean clone of the run branch, after any typecheck prerequisites, plus the repo's formatter in check mode on the changed files. Each exit code goes in the run record. The spec, docs and allowlist lines of Done do not apply. After that check and before `close.md`:

1. Drop dead hunks. A hunk in a file or export nothing imports renders nowhere, unless the framework loads the file by name, as file-based routers do. Grep for importers with the repo's path aliases, revert those hunks in one commit and list them as found-not-fixed rows. Done when every changed file in `git diff <base>...HEAD` has an importer or a framework name.
2. Check the base. `git log --oneline <tip>..<base>` must be empty, where the base is the commit the run branch started from and the tip is the upstream's default branch. With no upstream remote, the tip is the newest commit on the starting branch whose author is not the local setup, named in a decision row. If the log lists commits, Next opens "First rebase onto <tip>, since <base> carries <N> commits upstream doesn't have." and gives `git rebase --onto <tip> <base> <run-branch>`.
3. Write the PR body to `.design-system/pr.md`, which stays untracked through `.git/info/exclude`: a title, one line per family on what changed and why, the before and after numbers from `close.md` with units, every deliberate visual change a reviewer could argue with and its capture paths, what the PR left out on purpose, and the follow-ups. It never names the skills or the run record. Next is `Open the PR from <run-branch> with .design-system/pr.md as the body.`
