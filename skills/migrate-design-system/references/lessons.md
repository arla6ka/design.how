# Lessons

Eight lessons, each from a failure in a real migration. A lesson counts here only if it happened and a check can see it. Each says when to apply it, why, where to stop, and what enforces it.

## 1. An edit is the size of its change

**Apply when** a worker edits a shared checkout, or runs a formatter or codemod.
**Why** 102 of 152 agents ran `sed -i` after a prose ban, and BSD and GNU forms differ. A formatter on the wrong config rewrote more than 1,000 lines nobody meant to touch.
**Stop** if `git diff --stat` shows a file rewritten whole for a small change. Keep only the real hunks, and run the formatter and config the repo has now, which can change mid-run. A regex over many files is a codemod you diff.
**Enforced by** the host hook or the brief's BANS block, and `land.mjs`, which commits only named paths.

## 2. Payload strings are not copy

**Apply when** a copy rule, formatter or codemod touches a copied prompt, a model prompt, an API example, a clipboard value, legal text, data-layer strings or a string a test pins.
**Why** a curly apostrophe landed in a prompt users copy into an assistant. Nothing on screen showed it.
**Stop** before rewording. A migration never changes data-layer or model-prompt text. Flag it for its owner.
**Enforced by** element-scoped exemptions in the check, and a byte comparison of each payload string with the base commit after every sweep.

## 3. A control swap needs a parity table

**Apply when** a number, money, percent, date or file control changes.
**Why** an integer field saved 25 for `2.5`, and a file input rejected PDFs by extension though the MIME matched. Every visual check was green.
**Stop** on any differing row nobody approved.
**Enforced by** `node scripts/parity.mjs` and the classes in `parity.md`, including MIME with and without extension, upper-case extension and a wrong MIME.

## 4. A date-only value is not a moment

**Apply when** a surface shows, parses or sends a date.
**Why** a date-only value serialized through a local-midnight `Date` shifted a day west of UTC, twice, and some dates were already a day early before the run.
**Stop** on any `new Date("YYYY-MM-DD")` or local-midnight `Date` in a date-only path. Keep the value a string or a UTC date. A bug legacy already had is fixed in its own commit as an `intended change` row and named in the report, never silently.
**Enforced by** `parity.mjs date` under `America/Los_Angeles` and `Asia/Tokyo`.

## 5. Write bodies come from one run

**Apply when** a diff adds, moves or rewraps `mutate(`, `mutateAsync(`, `onSubmit`, `execute(` or a non-GET `fetch`.
**Why** two real runs joined by script produced a pair that passed and had to be reverted.
**Stop** if one logged run did not produce both body files.
**Enforced by** `land.mjs --bodies-check "node scripts/bodies-check.mjs ..."`.

## 6. Capture behind the guard

**Apply when** any script drives a live app.
**Why** a capture leaked a real update call and changed real data. Another script's abort filter matched the wrong URL shape and created two real records. Reads are POST in RPC APIs, so blocking non-GET blocks the app.
**Stop** before any run that can reach a backend until a dry run sent every known write, in the shape the app sends it, and saw each one blocked. Writes are denied by default and reads pass by exact name only.
**Enforced by** `capture-guard.mjs prove --writes <file> --read-procedures <names>` (exact names are its default), the guard installed before the first navigation, and its `guard.log`.

## 7. No write surface on a code read

**Apply when** a verifier cannot run the surface in a browser.
**Why** a grid landed at load 33 with no browser pass.
**Stop** and return `blocked` with the missing evidence and the command to rerun.
**Enforced by** the glossary: only `verified` at the surface's fingerprint lands a write surface.

## 8. Widths are measured inside the scroller

**Apply when** a table, grid or row layout changes.
**Why** 0 of 185 row controls were in view while a window-based script passed.
**Stop** if any control reachable before is not reachable at 390, 768, 1280 or 1920. Each width is a fresh navigation, with a 117-character title and 48 rows.
**Enforced by** the verifier's measurements in its verdict, and a blank-render rule (a capture under 700 bytes is deleted).
