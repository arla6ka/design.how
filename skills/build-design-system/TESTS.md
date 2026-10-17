# Tests: build a design system

Run these per `../TESTING.md`.

## Setup under test

Add to the shared list: mode and foundation, framework and styling method, the run command and whether it worked, and how many workers ran at once.

Keep practice repos in git so every run starts from the same commit: a hand-rolled app with hundreds of raw colors, no token file and several buttons; a copy-in registry app with edited ui files and palette classes in product code; an app whose thin ui layer many screens skip; an empty repo; and an open-source app the person does not own.

## Which cases apply

Every case applies to every setup, except these.

| Case | Applies |
|---|---|
| Called by a coordinator | When a router skill is installed |
| Worker scope, Memory pressure | When subagents are available |
| Foreground workers | Hosts where a subagent can start subagents |
| Exemplar | Runs where the person names exemplar screens |
| Harden mode | Apps with a weak component layer |
| Seed mode | Empty repos and new apps |
| Foundation owns its tokens | Copy-in registry and package-library apps |
| Measured traps, Motion | Runs with a browser |
| Limits by measurement | Runs with a browser |
| Document everything | Apps with more families than the pilot touches |
| Design source fidelity | Runs where the person gives a design file, brand kit or mockups |

## Done means

A passing run meets the Done list in `SKILL.md`. On top of it, each phase has a run-record row with an artifact path, inventory scripts ran again at handoff, nobody edited the baselines, and the final message pastes each check command with its exit code.

## Baseline

Prompt: "Build a design system for this app." Fill the table for Normal and Vague request. Watch for a token file written before any inventory, a palette borrowed from a popular system, colors that appear nowhere in the app, counts made by reading files, no screenshots before the first edit, every screen migrated at once, docs written by hand, and "the system is ready" with no check ever seen failing.

## Normal

**Input:** an app with about 20 routes, three button implementations (one a `div` with a click handler), two inputs with 6px and 8px radius, about 40 text grays, a CSS variables file half the code ignores, light and dark themes, and an invite form with an invalid-email state. The app runs and a browser is connected.

**Expect:** the run record exists before any edit. Inventory TSVs come from scripts saved under `.design-system/scripts/`. Baselines cover every reachable route at the narrow and wide widths and both themes. The `div` button loses the canonical pick with the reason recorded. Grays collapse into a few semantic roles. Merges inside tolerance are decisions, and each other cluster is a gate defaulting to merge, already applied. Each canonical component has a page, a generated twin and a registry entry. Checks fail on seeded raw values and deprecated imports. The invite flow is the pilot, reviewed by `ui-review` on its after screenshots. The handoff names `migrate-design-system` with counts by route and ends with the found-not-fixed table.

**Fails if:** a count has no script behind it, a new color or font appears, the codemod touches files outside the pilot and cleared surfaces, a commit lands on the starting branch, a twin was written by hand, or the predicate is reported met with a number not measured in phase 8.

## Vague request

**Input:** the normal repo, with the skill installed but not named, and "launch subagents to break down all screens in the app, we need to build a design system". Run once without design-system-boss installed and once with it. Then, with the boss installed, try "extract tokens from the app" and, in an empty repo, "start a design system from scratch".

**Expect:** without the boss, the agent picks this skill, asks for no paths, names a pilot and a budget as defaults in one Frame message, and starts phase 2 without waiting. Subagents work per route group, read only, writing notes under `.design-system/inventory/screens/`. With the boss, the whole-app ask goes to the boss, and the other two come straight here.

**Fails if:** the skill does not trigger, the first reply is a list of questions, a subagent writes outside `.design-system/` or its note is used as a count, or this skill takes a whole-app ask while the boss is installed.

## Called by a coordinator

**Input:** a router skill starts this one with a target app and a two-hour budget, once on a host where agents can start agents and once on a flat host.

**Expect:** it uses the target and budget as given, defaults the pilot, writes every open question to the Gates table, and ends with the handoff report. On the nested host its workers run as foreground calls, and no worker is live when it returns. On the flat host the boss's rule governs, and the one worker the boss names writes the token source and the first family alone before any fan-out. The codemod runs only on the pilot, and the root layout's token import is the only import change outside it.

**Fails if:** it asks the router a question mid-run, ignores the budget, ends on anything but the handoff report, applies both skills' seat rules at once, or fans out the first family.

## Missing required input

**Input A:** the normal repo with no working run command and no preview URL. **Input B:** no repo, only screenshots of the app. **Input C:** the browser times out on every route after the fifth, and the structural search tool `inventory.md` prefers is not installed.

**Expect A:** phases 1, 3, 4, 5 and 7 run from code, with baselines recorded as not possible and every visual claim as unverified. The run stops before the pilot, returns its artifacts, reports "code-complete, not runtime-verified", and asks for the command that starts the app. **Expect B:** it stops, says a system needs code to enforce it, and asks for repo access. **Expect C:** it names the failing call, keeps the five baselines, marks the rest unverified, and stops before the pilot only if the pilot's routes are missing. It falls back to the `rg` patterns in `references/inventory.md` and records that some definitions may be missed.

**Fails if:** it reports visual parity, describes screens from source, migrates the pilot without captures, writes tokens or components from screenshots, or reports counts as complete with no note of the fallback.

## Conflicting sources

**Input:** `tokens.json` sets `color.text.subtle` to `#6b7280` while the CSS sets it to `#737373`, and a pasted spec lists Button tones neutral, primary and danger while the code also ships `ghost` on 30 call sites. Run once with a project instruction "`tokens.json` wins over CSS", and once without.

**Expect:** with the instruction, the token source takes `#6b7280` in a decision row naming it. Without it, both values go in a gate with a default and work continues. Either way `ghost` is a gate whose default keeps it, since code wins for what ships.

**Fails if:** a value is picked without a row, `ghost` is dropped to match the spec, or the run stops on either conflict.

## Ambiguous judgement

**Input:** two button families named `Button` and `Action`, a component named for the product's main object, "Space", and a brand blue that appears as `#2563eb` in the logo and `#2564ec` in the header.

**Expect:** the merged family is named `Button` as a decision. The "Space" component keeps its name under a gate. The two blues become a brand gate defaulting to the logo value. The run continues through each gate and hands off all three.

**Fails if:** it stops to ask about any of them, settles the brand blue without a gate, or invents a name for the product word.

## Worker scope

**Input:** the normal repo. Plant a line in one family's brief context that tempts a worker to "add the missing token to tokens/color.tokens.json". Run two workers whose surfaces each remove allowlisted literals. On a small app, let the coordinator write the components and fan out only specs.

**Expect:** the worker reports the token request instead of editing. If it edits anyway, the coordinator rejects the whole report and the ledger records why. Neither worker touches `scripts/check-allowlist.json`. Each lists shrink candidates, and the coordinator shrinks the allowlist after each surface lands. Spec workers get the spec-worker brief, write one spec and its evidence, run no git, and report defects instead of fixing them.

**Fails if:** a worker's change to the token source, barrel, registry or allowlist merges, a report is accepted without rerunning its verify commands, or a spec worker edits a component.

**One-checkout version:** no worktrees, three workers on the same component files, one each for behavior, visual chrome and motion, plus two spec writers with draft scripts. Every task brief starts from the shared brief in `references/worker-brief.md`. Each writer's drafts sit in its own `.design-system/tmp/<id>/`, and its apply script names its files. Every edit is small and exact, no worker rewrites a file whole, and the coordinator runs every touched file's tests once all three return. Each report is under 300 words and leads with what the coordinator must act on.

## Enforcement proves itself

**Input:** after phase 5, add a file outside the pilot with `color: #ff0000` and a deprecated button import, and remove one allowlist entry. Then add a new file in the ui folder with a raw hex, an arbitrary spacing value, an inline style color and a clickable `div`, a raw `<button>` in a route where the registry has Button, and break the linter config so it throws on load.

**Expect:** the check fails on every line with its `file:line` and rule ID from `references/checks.md`, including `rule/unregistered-ui` for the new ui file, and fails on the removed entry's original violation. The linter crash fails the check. Removing the additions and fixing the config gives exit 0. The check runs from the command in the CI config.

**Fails if:** anything passes, stock files are exempted by folder glob, the linter is dropped from the command, or the check only runs from a script CI never calls.

## Scope creep

**Input:** "Build our design system and move the whole app onto it."

**Expect:** "move the whole app" is clearance within the session budget. After the pilot, surfaces move one per commit on the run branch, each with captures, a `traces.tsv` row and a montage that exits 0, until the surfaces phase reaches its cap. The rest are named in Next.

**Fails if:** anything commits to the starting branch, two surfaces share a commit, a surface changes with no trace row, or migration runs past its cap.

## Run branch

**Input:** a writing run started on the default branch with a clean tree. Run it with "make every page look like one thing", then with "set up a proper design system so the team stops drifting", where the build decides a Button codemod and a color move as gate defaults. Nobody answers during the run.

**Expect:** the first git action creates the run branch from HEAD, and the starting branch's log is unchanged at the end. Every gate reads `default (unanswered)` with its commit. The visual ask counts as clearance, and off-brand buttons move to the primary under their gates. Decided defaults land on every screen they reach. Each changed surface has before and after captures, a trace row naming its gate and one commit. A surface whose diff nothing explains is reverted and gated. Adding semantics, such as `aria-current` or a field label, is a decision, and removing a heading is a gate (`references/traps.md`, Adds-only accessibility changes). Next is a merge, or a merge with named reversals.

**Fails if:** a commit lands on the starting branch, a gate default exists only as a table row, every route captures at 0% after a visual ask, the Next prompt asks for a step the run decided, a semantics removal lands as a decision, or the run merges its own branch.

**Named branch version:** the person names their own working branch in the first message, or says "work on my current branch". The run commits there, cuts no `ds/` branch, pushes nothing, and records the branch as a decision.

**Dirty checkout version:** the tree holds uncommitted changes. The run asks the person which branch to use through the question tool before its first write, and never stashes.

## Answers the complaint

**Input:** a copy-in registry app where 16 lines use raw hex, 8 identical in value to an existing token, and "people hardcode colors everywhere, clean it up". A design review names an overflow at the narrow width that existing tokens can fix, and the shared layout overflows at the narrow width.

**Expect:** harden mode, with the complaint in the person's words in the Frame. `token-mapping` runs before specs, and the 8 identical-value swaps land on every screen with no gate, each route at 0% by `pixdiff.mjs` over every width and theme capture. Every other raw color within tolerance maps to its role as a decision, one beyond tolerance is a gate whose default is the merge, and only `graphic` values stay raw. Both overflow fixes land as decisions with captures and `scrollWidth` before and after. The final message leads with how many hardcoded colors are gone and names what is left.

**Fails if:** specs or docs come before any raw color moves, identical-value swaps wait on a gate, a status color defaults to "keep raw", or a cheap review fix lands only under follow-ups.

## Harden mode

**Input:** a shadcn app with every stock component installed, two team wrappers around Button, three edited ui files, no specs, and "our components are missing loading and error states, sort them out". The phase cap cuts Table and Card.

**Expect:** `base-shadcn.md` loaded and `components.json` read. `scripts/ui-drift.tsv` marks every ui file stock, customized or forked, each with a hash. `harden/gaps.tsv` lists missing states, precedence and keyboard paths. Every component gains its missing states, not only the pilot's. Loading follows the one fix in `references/component-contract.md`: the label and box stay, a spinner sits inside, `aria-busy` is set, focus stays on the control, and a second press does nothing. The wrappers merge by the contract with map entries. Table and Card leave with their states built or a gate naming each one, and a removed prop is a gate listing its call sites. `strays.tsv` exists. No stock file is deprecated or rewritten.

**Fails if:** only the pilot's components gain states, loading changes the box or drops focus, a family leaves with neither states nor a gate, a prop vanishes with no gate, or an overwrite of a customized file runs without a gate.

## Seed mode

**Input:** a new app with no UI, a logo SVG, a README line "our color is #0B5FFF, mobile first", and "give me a design system before we build any screens".

**Expect:** seed on the default foundation in `references/modes.md`, stated in the Frame. The brand hex goes into the primary role, converted to the token file's format by a script, with the hex in the role comment and a gate defaulting to it. Preset values kept as stock are decisions, not gates. Non-text pairs (checkbox border, focus ring with its alpha, checked fill) are measured against WCAG 1.4.11, and a failure is fixed in the owned token as a decision. Primary actions meet the mobile-first touch height in `modes.md`, as a decision. Dark mode follows the OS, proven by `capture.mjs --theme-via media`. The pilot is a list pattern page under the system route with empty, loading and error states. The montage runs with no before captures. Each coverage-gaps row has a Meanwhile that lets the next screen add what it needs.

**Fails if:** a second accent or new typeface appears, stock values arrive as gates, a dark OS gets the light page, the touch height is a gate, a product screen is built, or a gaps row forbids building a missing component.

## Foundation owns its tokens

**Input A:** a shadcn app whose product code uses `text-gray-500` for secondary text on 40 lines. **Input B:** a package-library app with a theme object, raw hex in inline style props and two `Button` wrappers.

**Expect A:** no DTCG generator. The lines land on `text-muted-foreground`. A new role is a new pair under `:root` and `.dark` with its `@theme inline` line. No shadcn name is renamed, there is no `--color-*: initial` reset, and palette classes fail under `rule/palette-use`. **Expect B:** `base-library.md` loaded, the theme is the token source, and direct library Button imports become map entries to the canonical wrapper.

**Fails if:** a generator writes over shadcn's lines, a shadcn variable is renamed, or a second token source appears beside the theme.

## Derived rules

**Input:** an app where 41 of 47 section headings render at weight 600 and 6 at 700, and where every resting card draws both a border and a shadow.

**Expect:** the rendered-style pass in `traps.md` runs in the browser and saves its output. The heading weight becomes a `rule/` line with its count and screens, and the outliers go to `strays.tsv`. The card edge is a majority trap, so it becomes a gate whose default is the trap's fix, border only, applied with its count.

**Fails if:** a rule has no count behind it, a value arrives from another product's system, or border plus shadow becomes the rule because it is the majority.

## The person's bans

**Input:** the normal repo after phase 3. The person states two bans. Plant one violation of each, one in the showcase chrome and one in a spec.

**Expect:** the bans go into the standing orders word for word, into every later brief, into `bans` in the check config, and into `docs/system/decisions.md` as numbered rows, and onto the writing page as `rule/ban-*` lines grounded `person D<n>`, with no quote of the person in any shipped doc. The check fails on both plants, and passes the same text on a `Don't:` line. The next commit has no hit outside `Don't:` lines, the coordinator's own chrome included.

**Fails if:** a ban lives only in chat or memory, a later brief lacks it, the check misses a plant, or a ban becomes a gate.

## Design source fidelity

**Input:** the normal repo plus a mockup file whose look the app does not have, with the answers "pixel fidelity" and "a new folder". Then the same run where the person, after seeing the sample, says "keep the existing look".

**Expect:** the source is read frame by frame after a frame listing, and `.design-system/inventory/design-structures.md` names each structure with its frame id, and the drawing scale is a decision. One or two components are restyled first, each captured beside a crop of its frame at the same scale in both themes, and nothing else changes until the person confirms. On "keep the existing look", the restyle stops and the sample reverts in its own commit. With no answer given, the rest waits under a gate that keeps the current look. Both questions went through the host's question tool. The pilot, baselines, pixdiff, the check and `gen-docs.mjs` run against the new folder, the brand page has a source map row per source element, and the handoff lists adoption blockers.

**Fails if:** more than two components change before the sample is confirmed, the source decides behavior or data, fidelity is assumed with no answer, the new look lands in place, or the revert touches other files.

## Rules by the method

**Input:** the normal repo after phase 4. A Select with 3 call sites, the longest list 9 options. A Tooltip with one call site. Plant one draft rule per defect in the Select spec: "Keep option lists short", "Use Select when appropriate", "Don't use placeholder text as a label", and a rule contradicting 3 of 3 call sites with only a principle behind it.

**Expect:** every Rules, Content, Anti-slop and Limits line has the rule shape from `references/rule-method.md`, with a `rule/select-<slug>` ID and a nested Don't and Do line of real code. The first two drafts are rewritten with a number, the third names what to do instead, and the fourth becomes a gate with the principle as its default. The Tooltip's rules say single use and add a measurement or principle, or ship `NEEDS REVIEW`. `docs/system/rule-tests/select.tsv` has a row per rule with all four tests, and the report counts shipped, rewritten and gated rules. `check-spec.mjs` fails each planted draft under its rule ID.

**Fails if:** a rule ships with no ground or no Don't and Do pair, a vague word survives, a don't has no instead, a rule overrules the app's majority with no gate, or a two-agent test is claimed with no subagent run in the transcript.

**Timing version:** the ask says the system is for agents. The first family's commit holds its component, tests, showcase page and spec with every rule in the final shape, and the person sees that page before any other family starts. Every later family lands its rules in its own commit, and phase 7 writes no rule by hand.

## Limits by measurement

**Input:** a segmented or tab-like control used on 2 screens with 3 options each, and the app's longest real label, at the narrow width.

**Expect:** `probe.mjs --grow` runs on a real route or example, grows the count until the control overflows, wraps or pushes content below the first screen, and saves JSON under `.design-system/evidence/<component>/`. The Limits rule sets its number one step below the reported break, names the alternative past it, and cites the file. When a call site already exceeds the limit, the spec says whether the limit or the call site is wrong.

**Fails if:** a limit has no measurement and no gate, the number equals the break instead of sitting below it, or a limit came from another product.

## Example files

**Input:** a Button with `variant` (3 values, one identical to default) and `size` (2 values), states pending and disabled, used inside a Dialog footer on one screen.

**Expect:** the spec's `### Example files` lists `default`, each variant value and size with a visual difference, `state:pending`, `state:disabled`, one `matrix:variant,size` and `composition:Dialog`. The value identical to default has a `Not applicable` row with its reason. Every file sits at `<examples dir>/button/<name>.<ext>`, starts with a `Caption:` comment, imports from the registry's import path, default-exports one example and passes the typecheck. The twin shows each file's source under its section.

**Fails if:** a variant value or state is silently missing, a file copies the component instead of importing it, an example sends a request, or the composition uses a parent no call site has.

## Writing foundation

**Input:** an app whose delete flow reads "Remove project" on the button, "Delete this project?" as the confirm title, "Delete" on the confirm action and "Project deleted" in the toast. 14 of 17 buttons are sentence case. Two error toasts start with an apology. 5 of 6 submit buttons swap their label to "{Verb-ing}…" while pending.

**Expect:** the writing page names each slot's sources, and `copy-check.mjs --extract` writes `docs/system/copy-inventory.tsv`. Slot rules carry counts from the inventory, with the 3 title-case buttons on the stray list. The delete flow is a declared verb chain, and `copy-check.mjs` fails it on "Remove" until the verb matches, or it is a gate. The apology word goes on the banned list only because the app's majority avoids it, with an Instead. The pending swap is the majority but a trap, so it becomes a gate defaulting to the trap's fix, and its wording becomes a `status` rule. Component specs cite `rule/writing-*` IDs under Content.

**Fails if:** a slot rule has no count, a voice rule or banned word comes from outside the app with no principle and gate, the inventory is hand-written, a confirmation belongs to no chain and no exempt row, or any rule lets a pending label change the button's box.

## Document everything

**Input:** a repo whose inventory has 14 families, a pilot that touches 4, and "document all our components".

**Expect:** after the pilot's 4 families, the writing page lands first, then one spec worker per remaining family with the spec-worker brief and `references/rule-method.md`, ordered by call-site count. Each worker writes its members' specs, rule-tests and missing example files, and no component code. The coordinator reruns one two-agent test per report. At the docs cap, each unreached family is a handoff line with its members and counts. Without "all", "every", "full" or "complete" in the ask and with no budget left, specs stop at the pilot's families.

**Fails if:** only the pilot's families get specs on the complete ask, one worker takes two families, a spec worker edits a component, or an unreached family goes unnamed.

## Measured traps

**Input:** a pilot with a Send button that appends "…" while pending, a row of two buttons where one label wraps at the narrow width, a panel whose fill equals the page, a nav that hides two links past its edge at the narrow width, a dialog taller than a short narrow screen, and an enter animation that runs under reduced motion.

**Expect:** the button box is measured idle and pending, and any width change fails `trap/loading-layout-shift` until the numbers match. `probe.mjs` lists the wrapped label with its line count, the flat panel, each hidden nav link with "no cue", the unscrollable dialog, and the animation. A stretched one-line button is not listed. The montage fails each new one unless its trace row names a gate.

**Fails if:** a trap is marked fixed with no before and after numbers, a wrap is missed because the height grew less than 1.5 times (the line count decides, not the ratio), or a clipped link reads as fine because the page no longer overflows.

## Icon set swap

**Input:** the person asks for a different icon set after two families have landed.

**Expect:** one commit swaps every icon. Before review, the icon sizes per control size are rederived and the alignment sweep in `references/browser.md` runs per context, beside text and alone in a box. The person decides from zoomed crops of each context in both themes.

**Fails if:** icons keep the old set's sizes, or one global offset moves icons in every context.

## Stress test

**Input:** after phase 4, a list component that fits at 390 and 1280 but overflows at 900 when the sidebar opens, a button whose label wraps at 360, and a disabled switch that still submits its value.

**Expect:** one worker per family group runs `references/stress-test.md` on the family's stress page in both themes at 360, 390, 768, 900, 1024, 1280 and 1536. The report lists the 900 overflow with its `scrollWidth`, the wrap and the submitted value. Each becomes a fix with before and after numbers, a Limits rule with its measured break, or a gate, and every component page gains an Edge cases specimen.

**Fails if:** the pass runs only at the two Frame widths, a break has no number, or a worker restyles a component.

## Live showcase

**Input:** a person who says "I review in the browser, not a workbench".

**Expect:** a dev-only route with one page per component and foundation, a sidebar that is navigation only, one `h1` per page, and the Usage rules rendered at the end of each page with their Don't and Do pairs. The link is given and opened in the host's preview pane.

**Fails if:** every component sits on one page, the sidebar holds previews or counts, or the rules are missing from a page.

## Project skills

**Input:** any full-footprint run, at handoff.

**Expect:** the repo holds use, maintain, review and migrate skills named after the product. Each points to the docs instead of restating rules, names real paths and commands, and every command in it ran once. The AGENTS.md block names all four. The worker that wrote them reported the inconsistencies it found, and each is fixed or gated before close.

**Fails if:** a skill cites a rule or trap ID only an installed skill defines, a command in one fails, or the skills point at the run record.

## Text entry and touch

**Input:** a spec for the app's text input, where the input has no `autocomplete`, a search icon sits in a sibling element outside the input's box, the field is not inside a `form`, input text is 14px at every width, hover styles are not scoped to hover devices, and the submit button stays clickable while its request is pending.

**Expect:** the spec's `Traps checked:` line names `trap/field-input-type`, `trap/field-affix-focus`, `trap/field-form-enter`, `trap/touch-input-zoom`, `trap/touch-hover-flash` and `trap/submit-repeat`, and each has an answer in its section: the autocomplete token and input mode per field kind, the icon inside the hit area and focusing the input on click, one form with one submit, input text at 16px or more at touch widths, hover styles under `@media (hover: hover)`, and a repeat blocked while pending.

**Fails if:** a trap is listed without an answer, the fix only changes the showcase and not the component, or the spec picks a duration the app does not use without a gate.

## Motion

**Input:** the app's menu grows from its own center, a toast restarts its entrance when a second toast arrives, a panel transitions every property, and three dialogs use three different durations. The migration replaces a raw `200ms` with a preset that resolves to `200ms`.

**Expect:** the motion presets name a job for each preset, and the menu gets `instant` or grows from its trigger (`trap/motion-origin`). Toasts continue from their current position (`trap/motion-restart`), and the panel animates transform and opacity only (`trap/motion-layout-property`). The dialog durations become one preset or a gate with the counts. The swap is proven by matching before and after animation lists taken with reduced motion off, never by a 0% pixdiff.

**Fails if:** a still capture is offered as proof of a motion change, a preset has no named job, or the fix keeps or adds an animation on a surface with no named job.

## Review, decide, fix

**Input:** after a fan-out of four spec writers, one page says a menu opens instantly and another gives it a 150ms fade, two specs name the in-flight prop `loading` and `pending`, a showcase page uses a raw hex, and someone hand-edited the rules index.

**Expect:** read-only lens reports, the newcomer and polish lenses included, each naming the commit it read, list the conflict with both `path:line` sides, the two prop names, the hex and the stale index. Every finding carries its evidence type and a dedupe key, and the lenses merge into one ledger where each finding is fixed, skipped with a reason, or moved to the roadmap. `docs/system/decisions.md` is committed with its precedence at the top and one decision per conflict, the rename included. The fix workers own disjoint files, write against the decided names, and the code worker lists the call sites its rename breaks. `gen-docs.mjs --check` fails on the hand-edited index until it is regenerated. Afterward both menu pages and the code agree.

**Fails if:** a decision lives only in the run record, a fix worker edits a file another owns, a review changes a file, an `inferred` finding reaches a fix brief unconfirmed, a message says done before the lenses ran, or the index stays hand-written.

## Generated docs

**Input:** after phase 7, delete `## States` from one page, swap `## Props` and `## Variants` in another, hand-edit a twin, and add `.docs h2 { font-size: 32px }` to a docs site where an example renders an `h2`. Run once with a budget too small for everything.

**Expect:** the docs check names the missing and out-of-order sections and the edited twin, and passes once restored. Every twin has its page's H2s in the order in `references/system-structure.md`. `check-docs-leak.mjs` fails on the heading by computed style, and prints SKIP with no browser. On the short budget, the HTML docs site and specs past the pilot's families go first, and the twins, `llms.txt` and the agent instructions block still exist.

**Fails if:** a broken page passes, the leak check compares source instead of computed styles, or the generated docs are cut.

## Small footprint

**Input:** any practice repo, then a repo the person does not own with an ask for an upstream PR that names two component families. Clone the full-footprint run branch afterward without installed dependencies, build output, `.design-system/` and any skill folder, and run the check command from the repo's manifest.

**Expect:** a full footprint vendors five scripts, their config, the allowlist, the drift list and stock copies, and no fixtures unless the run added a rule, with only `.design-system/review/**/*.png` and `.design-system/tmp/` in `.gitignore`. In the clone the check exits 0, running any type-generation step the framework needs first. The clone holds `surfaces.tsv`, `traces.tsv`, the probe files, the review reports and `index.html` with relative paths, and no PNG. On the upstream ask, a footprint gate defaults to minimal: tokens, touched components and screen changes, nothing vendored, `.gitignore` untouched, and `.design-system/` in `.git/info/exclude`.

**Fails if:** the check needs a file only the run folder or a skill folder had, fixtures or capture scripts land in the repo, a PNG is committed, a linked record is missing from the clone, or the minimal run copies scripts or edits `.gitignore`.

## Lock before fan-out

**Input:** a whole-system run with 8 families on a host with subagents. Midway, after four families land, the person changes the rule format.

**Expect:** before the first family worker starts, the run record shows each row of `references/coordinator-path.md` (Lock before fan-out) settled with its path: the branch, the bans in the check config, the design-source answer, the spec format with the first family's spec as exemplar, the icon sizes, the alignment reference the person picked from zoomed crops, each source conflict as a numbered row in `docs/system/decisions.md`, the motion presets and the showcase shell. The person has seen the first family's page. The format change runs as its own migration of every spec already written, one commit per family, with `check-spec.mjs` exiting 0 after each.

**Fails if:** a family worker starts before those rows are settled, or the change reaches only the next briefs and leaves four families in the old format.

## Phase caps

**Input:** a run with a two-hour budget, then the same run with none named.

**Expect:** the Frame's Budget line cites the caps in `references/coordinator-path.md`. A phase at its cap records what is left and the run moves on. Worker spawning stops at the cutoff `coordinator-path.md` sets, except for landing the safe moves. The coordinator opens each reference only as its phase starts.

**Fails if:** on a direct run, the run record carries a minutes estimate per phase, one phase eats the next one's share, or the coordinator reads every reference before phase 1.

## Final message

**Input:** any finished run that ends with an allowlist.

**Expect:** the Trial block names the fresh agent's check result, Blocking count, twins opened and gaps named. The final message follows `references/run-record.md`: one plain sentence answering the ask, then which screens changed and which did not, with the review page's path; each check command with its exit code; the gates that change a screen, unanswered defaults first, within the cap; one Next prompt that clears every gate at once, such as "Merge the run branch, but keep the blue Sign in button (reverse G-04)", and offers the migration with its size when there was no clearance; and the found-not-fixed table last. Every count appears in `.design-system/close.md`, and the message names the files still listed.

**Fails if:** the first line reads as a visible fix when nothing changed, the found-not-fixed list is split across sections or unranked, unchanged screens go unmentioned, Next points at a file or asks for a step the run could do, more gates appear than the cap, a red check is left out, a count is missing from `close.md`, or the message says "every screen" while `--left` lists anything.

## Memory pressure

**Input:** a host with subagents, where the free percentage reads below 10%, with swap near full. Then the same run with free memory above 10% and swap still full.

**Expect:** the Frame records the reading and the window as a decision. Below 10%, one worker runs at a time and work still delegates. Above it, the windows in `references/coordinator-path.md` (Machine budget) apply, whatever swap reads.

**Fails if:** the run starts no worker at all, waits for swap to drop, or runs more than one worker below 10%.

## Foreground workers

**Input:** a coordinator starts this skill as a subagent, and the build fans out three families.

**Expect:** the three workers start as foreground calls in one message, and the build returns only after all three report.

**Fails if:** any worker runs in the background, or the build hands back with a worker live.

## Unattended defaults

**Input:** a headless run with a brand-color conflict, a product-word name and a merge past tolerance, and nobody to answer.

**Expect:** each gate takes its stated default, reads `default (unanswered)` with its commit, and the run finishes. The handoff and the final message list the three unanswered defaults before any other gate.

**Fails if:** the run waits, stops on a gate, or buries an unanswered default below answered ones.

## Check-first landing

**Input:** "make it consistent" on an app with 12 routes, identical-value swaps on 9 of them, raw colors inside tolerance on 5, one merge past tolerance, and off-system buttons on every route.

**Expect:** no clearance. Outside the pilot, the swaps, the in-tolerance merges and the past-tolerance merge under its gate land, one surface per commit with captures and trace rows. The buttons outside the pilot stay, each route a found-not-fixed row with `no clearance`. Next offers the migration with its route and value counts. With "migrate everything" instead, the buttons move too.

**Fails if:** a button moves outside the pilot without clearance, a safe move waits for clearance, or Next omits the migration's size.

## Exemplar

**Input:** the person names one settings screen as the app's best. It uses a 16px field gap, while 9 of 12 other forms use 12px.

**Expect:** the Frame lists the screen as E1. The field-gap rule cites `exemplar E1` and the app count, as a gate whose default is 16px, and the 9 forms go on the stray list. With no exemplar named, the rule follows the 12px majority and nothing else changes.

**Fails if:** the majority wins with no gate while an exemplar exists, the exemplar wins over a trap, or the run asks about exemplars twice.

## Loading label

**Input:** a Save button whose label switches to "Saving" while pending, and another that appends a spinner outside its box.

**Expect:** both end with the idle label in place, the box measured the same idle and pending, a spinner inside the box, `aria-busy`, and a second press blocked with focus kept. Where the copy keeps "Saving", both labels sit stacked in one grid cell at the longer label's width. `check-system.mjs` flags the first button and passes the stacked form.

**Fails if:** the box changes width, focus drops to the page, or native `disabled` replaces the focusable block.
