# Running many agents

One migration ran about 850 subagents in 45 hours. The limit was never the number of agents. It was load, wedged servers and waiting. These are the few rules that paid for themselves. The one script is `scripts/land.mjs`. The rest is judgement and a few shell lines.

## Load valve

Do not spawn and do not start a browser run while the 5-minute load average is above 24 (adjust to the machine's cores) or free-plus-inactive memory is under 1 GB.

```
uptime                          # the second load number is the 5-minute average
vm_stat | head -4               # macOS; on Linux, head -3 /proc/meminfo
```

When blocked, wait and recheck every 30 seconds up to 30 minutes, then spawn nothing and say so. Name the three busiest processes to the person and kill none of them. Read memory as pressure and swap, because a "600 MB free" reading was file cache the OS would drop. The migration ran at load 75, and at its worst 167, against a cap of 24. Every worker slowed down.

## Browser slots

Run at most 3 browsers at a time. A slot is a folder made with `mkdir` that holds the owner's pid. Reclaim a slot only if `kill -0 <pid>` fails. Never `rm -rf` slot folders, because two workers then share one. A hung holder is reported with its pid and age, never killed. Bound every wait to 20 minutes and return `partial` with the rerun command. Waits of 35 to 90 minutes with no bound happened, and one verifier deleted its only loaded run to escape one.

## Backend health

Probe with a signed-in call. An unauthenticated 401 in 2 ms proved the web server was up while authenticated reads hung. If the probe fails for 60 seconds, the worker returns `blocked: server down` with a rerun script. It does not restart a shared server. One owner (the coordinator) restarts it, and the brief says who.

## Two sessions on one repo

Give each session its own id and its own MAY EDIT lists, and write the lists to a shared file. A file dirty at the start and unchanged is the other session's. Never settle a conflict by overwriting. Send the path of the other version to the coordinator. A scratch folder inside a package once broke the project build for both sessions, so scratch stays under `.design-system/tmp/<id>/`.

## Permission refusals

A refused call stops that worker's piece. Report the exact command and the refusal text, leave the files as they are, and finish whatever does not depend on the call. Do not retry with another flag, tool or script. The coordinator never runs the refused command for the worker. It asks the person with three options: allow it, skip the check that needed it, or hold the piece. Hold is the default. A refused health probe was reworded and retried for two hours while two signing pieces stayed unverified.

## Coordinators and resume

- A coordinator hands back after 25 landings or 6 hours. A fresh one rebuilds from the run folder. One that ran past that degraded and looped near 616k tokens.
- Never end a turn with a worker running. A background worker left alive keeps writing into a repo nobody checks. Spawn waves as foreground calls, several in one message, and drain before handing back.
- The host allows 20 live subagents. Keep the window at 8 to 12.
- Resume by fingerprint. If the verified commit equals the surface's fingerprint, land it. If equal and unverified, verify. If the files changed, rerun the checks. Four usage-limit cutoffs and one restart killed every worker, and resume cost minutes because the run folder held the state.

## Landing

`node scripts/land.mjs --help` has the flags. It takes a lock, builds the commit in a private index from HEAD, scans the staged diff for write lines, asserts the commit's file list equals the named paths, then resets only those paths in the shared index. A stale shared index once reverted a landed route, and the private index is why that cannot happen now.
