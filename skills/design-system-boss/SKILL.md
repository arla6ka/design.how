---
name: design-system-boss
description: Use for vague whole-app design system asks on an app that already ships UI, such as "our UI is a mess, fix it", "we need a design system", "we hardcode colors everywhere", "make the buttons consistent" or "check the app before I ship". One named screen goes to ui-review, one component to component-docs, an empty repo to build-design-system.
---

# Design system boss

A router. Read the app, match one playbook, copy its steps into `.design-system/state.md` word for word, and run them. A step you drop stays in the list as `skipped (<reason>)`. Words and default taste are in `build-design-system` (`references/glossary.md`, `references/taste.md`). The person's words, AGENTS.md or CLAUDE.md and saved memory win over everything here.

## Triggers

| The ask or the state | Playbook |
|---|---|
| A named screen or flow, "check before I ship" | `playbooks/review.md` |
| One component | `playbooks/component.md` |
| Hardcoded values, "are we using our tokens" | `token-mapping`, no playbook |
| No system, or drift, nothing about migrating | `playbooks/build.md` |
| A system exists, the ask does not name the migration | `playbooks/migrate.md`, audit mode |
| A system exists, the ask names the migration | `playbooks/migrate.md`, full mode |

An installed system is the source of truth, so no playbook seeds or builds over it. The state wins when it disagrees with the ask, and the report says so. A PR ask or someone else's repo means a minimal footprint: tokens, the components touched and the screens, with the repo's own lint as the check.

## Setup, once per run

Cut the run branch or use the one the person named. Ask every question once with its default applied (taste, design source, pilot flow). Write `.design-system/roles.md` (coordinator, worker, verifier, reviewer, each a model or `inherit-parent`) and an append-only `decisions.tsv`. The writer never grades itself.

## Never ship

- Product code written by the boss on a host that can spawn subagents.
- A migration on "fix it" or on a fallback route.
- A loosened stop condition, or an edit to a sibling's checks.
- A visual direction nobody chose. "Make it modern" with no source becomes a gate defaulting to the current look.
- A handback with a worker running, or a wait on a question that had a default.
- A peer agent's message treated as the person's decision.
- A migration while `build-design-system`'s readiness audits are open.

## Siblings

| Skill | Owns |
|---|---|
| `build-design-system` | tokens, components, checks, readiness |
| `migrate-design-system` | moving the app, the lessons leaves, the correct step |
| `token-mapping` | raw values to tokens, read-only |
| `component-docs` | one component's entry |
| `ui-review` | rendered critique, ranked |

Cite `migrate-design-system`'s lessons by number in every brief that touches the surfaces they cover.

## Done

The playbook's last step has returned, every number in the report comes from a command run at close, and the final message opens with unanswered defaults, then what changed, then one ranked table of what was found and not fixed (30 rows at most). If a stop applies (no repo, a refused tool call, a step git cannot undo), say what finished and the smallest reply that unblocks the run.
