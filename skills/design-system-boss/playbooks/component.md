# Component

1. Find the component, its stories and two real call sites. Stop with the missing input if there is no code, no variant list or no use.
2. Run `component-docs`. Save the draft to `docs/system/<name>.md`.
3. Run `ui-review` on one screen that uses the component, at both widths.
4. Run `token-mapping` on the component's styles. Report raw values as gaps, do not fix them.
5. Report the entry path, the conflicts and the questions with defaults.

Done when the entry meets `component-docs`'s Done list and the reply lists every Guessed at line.
