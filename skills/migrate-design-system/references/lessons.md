# Lessons

Eight lessons, each from a failure in a real 45-hour migration. A lesson counts here only if it happened and a check can see it. Each says when to apply it, why, where to stop, and what enforces it.

## 1. Exact edits, never `sed -i`

**Apply when** a worker edits a file in a checkout other workers share.
**Why** 102 of 152 agents ran `sed -i` after a prose ban, and BSD and GNU forms differ.
**Stop** if an edit needs a regex over many files. Write a codemod and diff it.
**Enforced by** the host hook or the brief's BANS block, and `land.mjs`, which commits only named paths.

## 2. Payload strings are not copy

**Apply when** a copy rule, formatter or codemod touches a file with a copied prompt, API example, clipboard value, legal text or a string a test pins.
**Why** a curly apostrophe landed in a prompt users copy into an assistant. Nothing on screen showed it.
**Stop** before rewording. Mechanical normalisation is free, rewording is listed.
**Enforced by** element-scoped exemptions in the check, and a byte comparison of each payload string with the base commit after every sweep.

## 3. A control swap needs a parity table

**Apply when** a number, money, percent, date or file control changes.
**Why** an integer field saved 25 for `2.5`, and a file input rejected PDFs by extension though the MIME matched. Every visual check was green.
**Stop** on any differing row nobody approved.
**Enforced by** `node scripts/parity.mjs` and the classes in `parity.md`, including MIME with and without extension, upper-case extension and a wrong MIME.

## 4. Dates run in two zones

**Apply when** a surface shows or sends a date.
**Why** formation dates shifted a day west of UTC, and some board dates were already a day early.
**Stop** before fixing a legal-date bug inside the migration. Report it.
**Enforced by** `parity.mjs date` under `America/Los_Angeles` and `Asia/Tokyo`.

## 5. Write bodies come from one run

**Apply when** a diff adds, moves or rewraps `mutate(`, `mutateAsync(`, `onSubmit`, `execute(` or a non-GET `fetch`.
**Why** two real runs joined by script produced a pair that passed and had to be reverted.
**Stop** if one logged run did not produce both body files.
**Enforced by** `land.mjs --bodies-check "node scripts/bodies-check.mjs ..."`.

## 6. Capture behind the guard

**Apply when** any script drives a live app.
**Why** a capture leaked a real update call and changed real data. Reads are POST in RPC APIs, so blocking non-GET blocks the app.
**Stop** if a procedure is neither a read verb nor fixtured. It is aborted.
**Enforced by** `scripts/capture-guard.mjs`, installed before the first navigation, and its `guard.log`.

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
