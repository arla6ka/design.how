# Skills for Design Systems

Skills that turn the UI your app already ships into a design system your coding agent can use, with a check that catches new drift, then move every screen onto it when you ask. It also has design systems you can install and start from.

Agents copy whatever is in the repo. If it has three buttons, forty grays and a token file half the code ignores, every new screen picks a different one. More agents spread the mess faster.

These skills come from building design systems for startups that raised millions. They read your app first, keep its look, and give agents components they can import, rules they can find, and checks that fail when they guess.

Follow along at [design.how](https://design.how).

## Install

```bash
npx skills@latest add arla6ka/skills
```

It works with any coding agent that reads skills. To install by hand, copy the folders in `skills/` into your agent's skills folder, such as `.agents/skills/`. If your agent installs skills by upload, download them at [design.how](https://design.how/skills) and upload the zips in the `upload` folder, one per skill.

## Why use it?

An agent with no system picks a button at random, invents a gray, skips the loading state and says it's done. It never checks the screens it didn't open.

Each skill swaps a guess for a step it can prove. It screenshots every route before the first edit, maps values to tokens by what they do, writes rules with a Don't and a Do, and runs checks that fail when a screen drifts. Nothing lands on your branch until you merge.

## Reference

- **[design-system-boss](./skills/design-system-boss/SKILL.md)**. Start here. Say what's wrong in plain words, and it reads the repo, picks a playbook and runs the other skills in order. It ends with the system, one flow moved onto it and a check, then offers the full migration with its size.
- **[build-design-system](./skills/build-design-system/SKILL.md)**. Builds tokens, one canonical component per family and a check from the app you have, and proves them on one real flow. Ends with five readiness audits before any migration.
- **[migrate-design-system](./skills/migrate-design-system/SKILL.md)**. Moves every screen onto the system with parallel workers, each verified by another agent against its before capture. Start with audit mode, which changes nothing. Carries eight lessons from a real 45-hour migration.
- **[token-mapping](./skills/token-mapping/SKILL.md)**. Maps hex codes and pixel values to your tokens by purpose, so an 8px radius never stands in for an 8px gap. It never edits.
- **[component-docs](./skills/component-docs/SKILL.md)**. Writes a component's docs from its code and two real uses, with the rules next to the examples.
- **[ui-review](./skills/ui-review/SKILL.md)**. Reviews a screen or flow, including states a screenshot misses, and ranks what's broken.

Shared words are in [GLOSSARY.md](./GLOSSARY.md). Your bans, widths and voice are in [taste.md](./taste.md); replace it with your own. Six scripts do the checks prose cannot: `check-system.mjs`, `land.mjs`, `bodies-check.mjs`, `capture-guard.mjs`, `legacy.mjs` and `parity.mjs`. Each has `--help` and `--self-test`. `node evals/run.mjs --lint` checks the skills themselves, and `--triggers` asks a host which skill each prompt starts.

## Design systems

Each one installs with shadcn and brings a skill, so your agent builds with its components and follows its rules.

- **[Lime](./systems/lime)**. Warm and light, for consumer apps, with one glowing action. `npx shadcn@latest add https://design.how/r/lime/theme.json`
- **[Quartz](./systems/quartz)**. Cold and calm, for AI agents and developer tools, with colour only for what a thing is and what went wrong. `npx shadcn@latest add https://design.how/r/quartz/theme.json`

MIT licensed.
