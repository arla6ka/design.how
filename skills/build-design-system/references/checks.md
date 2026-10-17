# Checks

Phase 5 turns every rule a script can see into a check that fails a build. Rule IDs match `traps.md` and the specs, so a finding, a spec line and a failing check all name one thing. The skill ships `scripts/check-system.mjs`, a dependency-free Node starter, which setup copies into the repo's `scripts/`. Extend it, or move its rules into the repo's own linters. Add no dependency when a short script will do.

Contents

- The starter
- Projects with a design lint
- What the check covers
- Bans
- Exempting stock files
- Palette use is its own count
- The allowlist
- Passing a rule by hiding from it
- What the check can't see
- The check has to run
- CI tiers
- Proving each rule
- At handoff

## The starter

`scripts/check-system.mjs` reads whole JSX tags, not lines, so a `<div` with `onClick` three lines down is one tag. `--help` lists every flag. The usual sequence:

```sh
node scripts/check-system.mjs --init              # writes scripts/check-system.config.json from the repo
node scripts/check-system.mjs --hash-stock        # copy-in or library ui files: hash every row of scripts/ui-drift.tsv
node scripts/check-system.mjs --save-stock components/ui/button.tsx .design-system/tmp/button.json   # upstream's copy of a customized file
node scripts/check-system.mjs --rehash components/ui/dialog.tsx --note "G-04: close button kept, reviewed"   # after a reviewed edit
node scripts/check-system.mjs --init-allowlist    # once, to record today's violations
node scripts/check-system.mjs                     # the repo against the allowlist
node scripts/check-system.mjs --files app/team/invite/page.tsx   # the pilot; the allowlist applies, and --no-allowlist shows everything the file holds
node scripts/check-system.mjs --prune-allowlist   # at close: drop entries that no longer match a finding
node scripts/check-system.mjs --no-self-test --left   # at close: what the allowlist still holds, by file and rule
node scripts/check-system.mjs --changed origin/main --warn --summary "$GITHUB_STEP_SUMMARY"   # CI tier 1: warn on what a pull request adds, exit 0
node scripts/check-system.mjs --ratchet scripts/check-ratchet.json   # fail only when a rule's count rises; writes the file when missing
node scripts/check-system.mjs --ratchet scripts/check-ratchet.json --ratchet-update   # lower the file after a count falls, never raise it
node scripts/check-system.mjs --explain trap/button-div   # the rule, why, and the fix
node /abs/skills/build-design-system/scripts/check-system.mjs --root /abs/app --no-self-test   # from any folder
```

Read the config `--init` writes and the lines it prints. `tokenSources` (files whose custom property lines may hold raw values), `uiDir`, `registry`, `driftList`, `allowlist` and `nativeControls` are guesses from the repo. `nativeControls` maps each native tag to the component the ui files export, such as `<button>` to `Button`. `--init` never writes an empty value such as `nativeControls: {}`, which would turn a rule off. It leaves an unfillable key out, so the default applies, and prints why. An old `{}` counts as unset. `rulesOff` turns a rule off, and so does `projectLint` for the four rules below. `sharedTokens` lists `:root` colors meant to hold one value in every theme. `varIgnore` lists custom property names and prefixes a library sets at runtime.

On an app that installed a namespaced system (`base-shadcn.md`, Distribution), `--init` reads the install's layout. `uiDir` becomes `components/<name>/ui`, and a CSS file at the top of `components/<name>/` that defines custom properties under the system's own selector joins `tokenSources`. A custom property the code reads, that nothing in the repo defines and a dependency's code sets, goes in `varIgnore` by full name, or by prefix when the dependency builds the name from one, with the package that sets it. A name a dependency only reads stays reported. Every run skips the system's lint plugin in `lib/<name>/lint/`, since its messages quote the values it forbids. With no registry file in the app, the ui folder came from someone else's registry, so `rule/unregistered-ui` is skipped with a note.

The scan skips the Excluded paths in `inventory.md`, plus all of `public/`, which holds only generated output, and `scripts/`, which holds the check itself. It always scans the docs' example files (`examplesDir` in `scripts/gen-docs.config.json`, default `docs/system/examples`), since readers copy them into product code. The native-button rule appears on the first run after a canonical Button exists. Everything the check reads lives in the repo, never in `.design-system/` or a skill folder.

## Projects with a design lint

A design lint knows the design system's classes and components, so it already covers `rule/raw-value`, `rule/palette-use`, `rule/arbitrary-value` and `rule/component-override`. The check finds one in two places: an installed design system's own lint config at the root (`<name>.<tool>lint.config.mjs` beside `components/<name>/` or the system's skill), or the project's own lint config at the root that loads one. It skips those four rules and prints a note naming the config it deferred to, so one finding never fails under two IDs.

1. Run the project's design lint first and record its command and exit code. Its findings are the four rules' findings, reported under the lint's own rule names.
2. Run the check for every other rule. The lint's other rules have no twin to skip, so `rule/inline-px` and the rest still run.
3. The first ratchet run after the switch reads the four counts as a fall. Lock it with `--ratchet-update` in the same commit.

The lint goes in the check command ahead of the script, so a clean clone runs both. Set `"projectLint": false` in the config when the lint turns those rules off, so the check runs them again.

## What the check covers

One command, such as `npm run check`, runs every rule below and exits nonzero on any failure. Each failure prints `file:line`, the rule ID and the fix. The rules that name utility classes (`rule/arbitrary-value`, `rule/palette-use`, `rule/doubled-utility`) find something only in an app that styles with Tailwind. Tag rules read JSX. Value rules also scan Vue, Svelte and Astro files and every CSS dialect, so a team on another stack extends the tag rules for its templates.

| Rule | Fails on | Starter |
|---|---|---|
| `rule/raw-value` | Hex, `rgb()`, `hsl()`, `oklch()` outside a token source line, including inside arbitrary values such as `shadow-[0_1px_rgba(0,0,0,.1)]`. `hsl(var(--x))` is token use | yes |
| `rule/named-color` | CSS named colors in styles, style props and SVG paint attributes, in any quote style. `transparent`, `currentColor` and `inherit` pass | yes |
| `rule/arbitrary-value` | Tailwind arbitrary values such as `p-[13px]` or `[mask-type:luminance]`. Variants such as `data-[state=open]:` and a bare `[var(--x)]` pass. So do values that pick no step off a scale: a transition's property list such as `transition-[background-color,border-color]` (what `trap/motion-transition-all` asks for), a CSS-wide keyword such as `gap-[inherit]`, a grid area or line name such as `[grid-area:stack]`, and math built only from tokens, `env()`, unitless numbers, `%` and viewport units, such as `pb-[calc(var(--space-4)+env(safe-area-inset-bottom))]` | yes |
| `rule/palette-use` | Tailwind palette classes such as `text-gray-500`, and `var(--color-teal-700)`. Also solid `white` and `black` utilities (`bg-white`, `text-black`, `border-black`) once the theme defines a role for the job: a surface for `bg`, a foreground for `text`, a border, input or ring for `border`. Opacity forms such as `bg-black/50`, and `transparent`, pass | yes |
| `rule/doubled-utility` | A utility that repeats its property word: `text-text-muted`, `bg-bg-subtle`, `border-border-strong`. It means a `--color-<role>` role starts with text, bg or border (`token-architecture.md`). A plain `border-border` passes | yes |
| `rule/inline-px` | px, rem and em lengths for spacing, radius, size and font size in `style={{ }}`, including bare numbers such as `padding: 12`. The id keeps its old name so allowlists still match | yes |
| `rule/css-px` | px, rem and em lengths for spacing, radius, type and size in CSS files, outside custom property lines. `0`, `1px` and media queries pass, and rem or em pass in line-height, letter-spacing and viewport math such as `calc(100dvh - 2rem)`. The touch zoom floor `font-size: max(16px, 1em)`, the fix for `trap/touch-input-zoom`, passes. In a class, `p-[1.25rem]` is `rule/arbitrary-value` | yes |
| `rule/token-parity` | A `var(--x)`, theme reference or `bg-(--x)` that no CSS file defines, with no fallback. A key the dark theme block defines that `:root` does not, and a `:root` color with no dark value. Bare HSL channels such as `222 47% 11%` count as colors | yes |
| `trap/native-control` | A native `<button>`, `<input>`, `<select>`, `<textarea>` or `<dialog>` where the system has the component, outside the ui folder | yes |
| `trap/button-div` | `onClick`, `onPointerDown` or `onMouseDown` on a `div`, `span`, `li` or other non-interactive element, or on an `<a>` with no `href`. `tabIndex` of 0 or more with `onKeyDown` on one. An element with a `role` passes, and so does a native `<dialog>` with `onCancel` (below) | yes |
| `trap/role-button` | `role="button"` on anything but a `<button>`, including `<a>` and `Link` | yes |
| `trap/link-as-button` | An `<a>`, `Link` or system link component (an export ending in `Link`) whose own style or classes set both a background and padding, tokens included. Also a `variant` prop on `<a>` or `Link`, the Button's class names, 4 or more of its classes plus a height, or an app-CSS button class. The Button's style helper and single-element composition (`render`, `asChild`) pass. A `block`, `flex` or `grid` link is a card or row link and passes, and so does a background shown only on hover or focus | yes |
| `trap/button-clone` | Any other element carrying the Button's class names, 4 or more of its classes plus a height, or an app-CSS button class. An app-CSS button class is one whose rule sets a background and padding, and whose name says btn, button or cta or which sits on a `<button>` somewhere | yes |
| `trap/link-wraps-button` | A link with a `<button>` or `Button` inside it, or a button with a link inside it. Single-element composition (`asChild`, `render`) passes | yes |
| `trap/loading-label-swap` | A `<button>` or Button whose children hold a ternary with a string label on a state the same tag gets as `disabled`, `loading`, `pending` or `aria-busy`, or on a state named like a loading one (`saving`, `pending`, `isSubmitting`). `{open ? "Hide" : "Show"}` on a toggle passes, and so do both labels rendered in one grid cell with the inactive one hidden, which is the fix (`component-contract.md`, Variants and states) | yes |
| `trap/motion-transition-all` | `transition: all` or the `transition-all` utility | yes |
| `trap/motion-ease-in-enter` | An ease-in easing on the same rule or element as an enter keyframe or enter class | yes |
| `trap/motion-overshoot` | A `cubic-bezier()` or a motion library `ease` array whose second or fourth value falls outside 0 to 1 | yes |
| `trap/hover-unguarded` | A CSS `:hover` rule outside `@media (hover: hover)` that changes `display`, `visibility` or `opacity` | yes |
| `trap/zoom-disabled` | `user-scalable=no` or `maximum-scale=1` in the viewport meta | yes |
| `trap/viewport-height` | `100vh` or `h-screen` on a full-height shell | yes |
| `trap/touch-autofocus` | `autoFocus` or `autofocus` on a field in a page, outside a dialog | yes |
| `trap/touch-tap-highlight` | `-webkit-tap-highlight-color: transparent` with no press style to replace it | yes |
| `rule/component-override` | A `className` or `style` on a registry component that sets padding, radius, shadow or background: a utility (`p-0`, `rounded-full`), an inline style key, or an app-CSS class whose rule sets one. Layout (margin, width, grid or flex placement, overflow) passes. The names come from the registry's ids and its source files' exports | yes |
| `trap/label-unbound` | A `<label>` or `<Label>` with no `htmlFor` and no control inside it, outside the ui folder. A spread (`{...props}`) passes | yes |
| `trap/overlay-conditional-render` | `{open && <Dialog>}` or `{open ? <Dialog> : null}`, for the components in `overlayComponents` | yes |
| `rule/stock-edit` | A file on the drift list, stock, customized or forked, whose hash differs from its row in `scripts/ui-drift.tsv` | yes |
| `rule/unregistered-ui` | A file directly in the ui folder with no registry entry and no drift-list row | yes |
| `rule/deprecated-import` | An import of a path the registry lists under `replaces`, or the config's `deprecated` | yes |
| `rule/ban-<slug>` | A pattern the person banned, from the config's `bans`, in UI code or a docs page (Bans, below) | yes, once `bans` lists one |
| `rule/outside-name` | An outside product name from the config's `names` in a docs page. A warning, never a failure (Bans, below) | yes, once `names` lists one |
| `spec/*` | `node scripts/check-spec.mjs docs/system` | separate script |
| docs | `node scripts/gen-docs.mjs --check`: every twin, the rules page, the index and `llms.txt` match a fresh generation | separate script |
| `copy/*` | `node scripts/copy-check.mjs`, added to the check in phase 7 once `docs/system/writing.md` exists: a stale copy inventory, and strings that break the writing page (`writing-method.md`) | separate script |

Add each `trap/` or `rule/` from the specs that a regex or AST query can see, under its own ID, with fixtures. A rule a script cannot see shows its own `Check:` clause, or "review", on the generated rules page.

## Bans

Every ban the person states in the Frame or later becomes one entry in `bans` in `scripts/check-system.config.json`, with its rule id, a pattern and the person's words: `{"id": "rule/ban-middle-dot", "pattern": "\u00b7", "why": "no middle-dot separators"}`. The check scans UI code with comments stripped, and the Markdown pages under `banDocs` (default `docs/system`), so specs, foundation pages and the showcase's copy are covered. A line holding `Don't:` or the ban's own id describes the ban and passes. A casing ban needs a pattern that sees the casing, such as a class or style that uppercases text. Add the entry in the same commit as the standing order, and see it fail once on a planted line.

The optional `names` list holds outside product names the shipped docs should not carry, such as a design system the team studied. A hit in a `banDocs` page prints as a `rule/outside-name` warning and never fails the check.

## Exempting stock files

Stock files the team never edited carry upstream's raw values, which are not drift. Exempt them by name, never by a folder glob, which exempts every new file dropped into the folder, where drift goes first.

The drift list is `scripts/ui-drift.tsv`, with the columns `file`, `status` (`stock`, `customized` or `forked`), `sha256` and `note`. Every row carries a hash, so any edit to a primitive shows up as a drift-list change. The check exempts a `stock` row from the other rules only while its hash matches. A `customized` or `forked` file is scanned like product code, and its hash is checked too. Any mismatch fails `rule/stock-edit`. `--hash-stock` fills empty hash cells and never changes one. After a reviewed edit, `--rehash <file> --note "<what changed and why>"` records the new hash and the note, and refuses to run without a note. Check the row's status in the same commit. A new file in the ui folder is checked and needs a registry entry.

A customized file still carries upstream's own literals, which are not drift. Save upstream's copy once with `--save-stock <file> <upstream>`, where `<upstream>` is a plain file or the library's item JSON (`base-shadcn.md` says where shadcn serves it). It lands at `scripts/ui-stock/<file>.stock` and is committed with the drift list. A finding from a literal-value rule (raw value, named color, arbitrary value, palette, px) on a line identical to a stock line, whitespace aside, is exempt, and the report counts the exemptions. Every line the team changed or added is scanned like product code. `rule/token-parity` is never exempt, since a variable nothing defines is broken either way. A `forked` file gets no stock copy, since the team owns every line.

A customized row with no hash lets an edit through unseen, such as a popover surface token swapped for a solid white that breaks dark mode.

## Palette use is its own count

Palette classes (`text-gray-500`, `bg-blue-600`) come from the framework's default theme, not from the project's token source. They are primitives with no stated purpose, so they are neither raw values nor token use. Count them under `rule/palette-use`, report them apart from raw values, and let the allowlist hold the existing ones. This matches `token-mapping` and the router's triage.

Utilities built from the project's own semantic names (`bg-muted`, `text-muted-foreground`) are token use, with or without an alpha (`bg-primary/80`). A palette class with an alpha is still palette use. Blocking the palette at build time is a foundation choice, and the base reference says whether it is safe.

## The allowlist

Existing violations outside the pilot go in `scripts/check-allowlist.json`, written once by `--init-allowlist` and committed with the check. It is keyed by file, rule and literal value, with a count for each: `{"app/billing/page.tsx": {"rule/raw-value": {"#111827": 1}}}`. A count may instead be `{"count": 1, "removeBy": "2026-06-30"}`, and the check warns, never fails, once the date has passed, so an old debt resurfaces. The check fails when a literal's count grows, or when a literal it has no entry for appears, so swapping an allowed hex for a new one fails. `--shrink-allowlist` writes dropped counts back and never raises one. `--prune-allowlist` only removes entries that match no finding now, such as a fixed literal or a deleted file. The close runs it, so a fix never leaves a stale entry that would let the literal come back.

The allowlist has one writer, the coordinator. Workers never edit it, since parallel edits drift the counts. A worker lists shrink candidates in its report (file, rule, literal, the count its `--files` run finds), and the coordinator runs `--shrink-allowlist` after landing each surface and commits the allowlist on its own. The allowlist never holds violations in lines this run wrote. In the pilot's files it holds only a one-off value a decision row names, so `--files <pilot files>` exits 0 and `--left` lists nothing else there. Upstream's lines in a customized ui file are exempt through its stock copy. Lines the team wrote there before the run go in the allowlist like any product code.

A check that points at an allowlist file that does not exist fails every finding, and says so.

## Passing a rule by hiding from it

Moving a handler into an effect, a ref callback or a runtime class string so a rule stops seeing it is itself a violation, recorded as the rule it hides from. The common case is moving a `<dialog onClick>` out of sight to pass `trap/button-div`, when the fix is already allowed. A native `<dialog>` closes on Escape through its cancel event, so a click handler on the element itself is the backdrop pattern. It passes when the same element wires `onCancel`, its keyboard path:

```tsx
<dialog ref={ref} onClick={(e) => e.target === ref.current && close()} onCancel={close}>
```

A `<dialog onClick>` with no `onCancel` still fails.

## Shipping a design lint

A system shipped through a registry can ship its lint as one more registry item, so every app that installs the system gets the rules in its editor and its check command. The check then defers to it (Projects with a design lint).

- The item installs the plugin in `lib/<name>/lint/` and its config at the root. The plugin reads a list of the system's classes that the build generates, so it never loads the styling framework.
- Each lint rule's `meta` names the doc rule id it enforces, and its docs link points at the page that defines that id. A message names the fix: the token, class or component to use instead.
- Every lint rule has a bad fixture that must produce its finding. One good fixture, real code written to the system, must stay clean under every rule, which catches a rule that fires on correct code.
- The build runs the fixtures before it publishes the item, and fails on a lint rule whose doc rule id no page defines.

Done when every lint rule names a defined doc rule id, every bad fixture fails, the good fixture is clean, and the build runs all three checks.

## What the check can't see

Every report ends with "The check cannot see", from `--list-blind-spots` (`blindSpots` in `--json`), and `gen-docs.mjs` copies it to the rules page. It names rendered and non-text contrast, behavior (what Enter, Escape or Cancel does, focus return), layout and target size, overrides on unlisted components or built at runtime, loading states that do not use a label ternary, class names built at runtime, framework built-ins such as `bg-white`, files outside `include`, stale role comments, and the rules marked "review". A final message that says the check guards drift names these limits in the same breath.

## The check has to run

- The command is one line in `package.json` (or the repo's task runner), for example `node scripts/check-system.mjs --ratchet scripts/check-ratchet.json && node scripts/check-spec.mjs docs/system && node scripts/gen-docs.mjs --check`, plus the repo's typecheck and lint. Include any step those need to pass on a clean clone, such as generating types first. The base references give stack examples.
- Run it yourself and read its exit code. Before handoff, run it again on a clean clone: a fresh `git clone` of the branch with its dependencies installed, and no `.design-system/` or skill folder.
- If the check uses a linter, a linter crash fails the check. Never drop the linter from the command to get a green result. Fix its config, or remove the rules that depend on it, and say so in a decision row.
- A rule the repo's own linter can already express may live there instead, with the same rule ID in its message. For example, a restricted-imports rule listing the deprecated import paths, or a no-hex-color rule for CSS.
- Every index, twin or table derived from other files is generated, never written by hand, and the check runs its generator with `--check`, which also fails on a duplicate rule ID.
- List generated output in the formatter's ignore file, or format it in the generator with the repo's formatter and config, before writing or comparing. Otherwise the first formatter run makes `--check` fail for good. Run the formatter from the repo root with the repo's own binary, since one run inside a container or another folder may pick up another config. Formatters can move backticks in inline code that holds backticks, so write such examples as fenced blocks, and rerun the docs check after formatting.
- If CI exists, read its config and confirm the command is in it. With no CI, say "runs locally, not in CI". Claiming the check blocks merges needs the CI config.

## CI tiers

The handoff sets up two tiers, so a pull request gets fast warnings and the slow checks still run.

- Tier 1, every pull request: the blocking check command above, then `node scripts/check-system.mjs --changed <base ref> --warn --summary "$GITHUB_STEP_SUMMARY"` and `node scripts/check-spec.mjs docs/system --no-fresh`.
- Tier 2, nightly, or on pull requests that touch `docs/system/` or the token source: the full `check-spec.mjs` and `stress.mjs --base <url> --routes .design-system/review/surfaces.tsv`, whose `stress/` findings `stress-test.md` lists.

`--changed` keeps only findings on lines the pull request added or changed, and an allowlisted literal warns only past its count, so existing violations stay quiet. `--warn` prints each finding with its rule ID and the system's alternative, as a GitHub annotation on the changed line when `GITHUB_ACTIONS` is set and as `file:line warning ...` elsewhere, and exits 0. It skips the self-test. `--summary <file>` appends every warning to the file as a Markdown table, so nothing is lost past the host's annotation cap. The ratchet in the blocking command fails only when a rule's count rises (`--ratchet` alone reads `scripts/check-ratchet.json`), so drift cannot grow while the allowlist shrinks. After a fix lands, `--ratchet-update` lowers the file in the same commit. A minimal GitHub Actions tier 1:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
- run: npm run check
- run: node scripts/check-system.mjs --changed origin/${{ github.base_ref }} --warn --summary "$GITHUB_STEP_SUMMARY"
  if: github.event_name == 'pull_request'
- run: node scripts/check-spec.mjs docs/system --no-fresh
```

Other CI hosts pass the base branch the same way, or pipe their own diff with `--diff -`. A shallow clone has no merge base, so the warn step prints one warning saying so and exits 0. The AGENTS.md block says the warnings exist, and `--explain <rule-id>` gives an agent the rule, why and the fix (`system-structure.md`, Load conditions in AGENTS.md).

## Proving each rule

Every rule the run adds gets a failing and a passing fixture under `scripts/fixtures/check-system/<rule>/`, in `fail/` and `pass/` folders with a `case.json` naming the rule and the exact count the failing folder must produce. Fixture sources end in `.fixture` (`list.tsx.fixture`), so the typecheck, lint and framework never compile them, and the self-test reads each under its inner name. The default run self-tests whatever sits there.

- The failing fixture holds exactly the patterns the rule catches, such as a three-line `<div onClick>` or `p-[13px]`.
- The passing fixture holds the nearest correct form, such as `<Button>` or `p-3`, and must produce no finding at all.
- The `unregistered-ui` failing fixture is a file in the ui folder, not on the drift list, with raw hex in it. It must fail both rules, which catches a glob exemption.

The normal scan skips `scripts/` entirely.

## At handoff

Run the full check on a clean clone and paste the command and its exit code into the final message: `npm run check exit 0 (clean clone)`. Name the CI file that runs both tiers, or say "runs locally, not in CI". The allowlisted and left counts come from `--left`, saved in `.design-system/close.md` (`coordinator-path.md`), and the message names the files still listed. The run record's handoff copies the blind spots. A red check at handoff is a failed run, never a footnote. When a rule cannot be made green in time, move its existing hits into the allowlist with a count, and say so.
