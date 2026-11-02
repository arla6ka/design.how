---
name: crystal-cluster
description: Builds a three.js scene in which a small flat-shaded crystal cluster with a constant-width gold screen-space outline floats in a rising gold beam of light, drawn in one fragment shader as soft gaussian columns with flicker, rising bands and a glow pool, over a soft glow, bobbing and leaning toward the pointer. Use when someone asks for a loot beam, a rarity glow, a legendary item reveal, a game item showcase, an outline shader in three.js, or a glowing light pillar effect.
---

# Crystal cluster

A gold-outlined crystal cluster floating in a flickering gold beam of light. See it live at https://design.how/vault/crystal-cluster.

## What to build

In the middle of a dark warm room, a small cluster of teal crystals hangs in the air, one tall one and two smaller ones leaning off it, every facet flat-shaded so each catches the key light differently. A thin light-gold line traces the whole silhouette at the same width from every angle. Behind it a gold beam rises to the top of the card, five soft columns of light that sway, flicker and carry two bright bands drifting upward, with a pool of glow at the base. The cluster bobs a little, leans toward the pointer, and the beam brightens while the pointer is over the card.

The outline is a hull, not a post effect. Each crystal gets a child mesh with the same geometry, drawn back faces only and before the crystal, whose vertices are pushed out along their normals in clip space by a fixed number of pixels over the drawing-buffer size. Because the offset is in screen space, the line stays 4 pixels wide whatever the angle or distance, and only the part outside the silhouette shows.

The beam is one tall additive plane behind the cluster with all the work in its fragment shader. Its brightness is a sum of five gaussians across x with weights 0.3, 0.75, 1, 0.3 and 0.3, widening with height, inside an envelope that rises fast from the base and fades out above the middle. Value noise scrolling upward and a slow pulse make it flicker, and two sine bands looping up it read as energy rising. Depth testing lets the crystals hide the beam where they overlap it. A canvas radial gradient on an additive plane is the soft glow behind them.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/crystal-cluster/`. It is React and TypeScript: `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/crystal-cluster` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Build the cluster from flat-shaded octahedrons, and give each a back-face hull child whose vertices are offset in clip space by OUTLINE_PX over the drawing-buffer size, drawn first.
- Draw the beam on a tall additive plane behind the cluster, with five widening gaussian columns, a vertical envelope, upward-scrolling noise, a slow pulse, two rising bands and a base pool, with depth testing on.
- Put a canvas radial-gradient texture on a wide additive plane just behind the cluster for the glow.
- Each frame, ease the cluster toward its rest pose plus a lean toward the pointer, bob it on a sine, and brighten the beam with the pointer's nearness to the centre.
- Update the outline's size uniform on resize, so its width stays constant.
- Stop on webglcontextlost; on destroy dispose every geometry, material and texture, then renderer.dispose() and renderer.forceContextLoss().
- Under reduced motion, draw the rest pose once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `CRYSTAL_COLOR` | #2fb6a8 | The crystals' colour. |
| `OUTLINE_COLOR, OUTLINE_PX` | #ffef7a, 4 | The outline's colour and width in pixels. |
| `BEAM_CORE, BEAM_GOLD` | #ffe63a, #ffd21e | The beam's core and edge colours. |
| `PULL` | 0.4 | The most the cluster leans toward the pointer, in radians. |
| `BACKDROP` | a dark warm radial gradient | The room behind the canvas. |
