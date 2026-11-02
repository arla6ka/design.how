# Performance contract

Every visual keeps these rules. `scripts/check.mjs` checks each one in the source; this file says why.

## Pause when nobody is looking

- Stop the animation loop when the element is off screen. An IntersectionObserver at a threshold of about 0.2 is enough; `runtime/use-pause.ts` does it.
- Stop it when the tab is hidden: listen for `visibilitychange` and check `document.hidden`. A background tab still runs requestAnimationFrame in some browsers.
- Keep the clock across a pause. Store elapsed time on stop and resume from it, so a scroll back does not jump the animation.

## Reduced motion

- Read `prefers-reduced-motion: reduce` before starting, and listen for changes.
- When it is set, never call start(). Call `renderStill()` once, which draws the frame that best stands for the piece.

## Pixel ratio

- Size the canvas backing store at the CSS size times `Math.min(devicePixelRatio, 2)`, never more. A 3x screen costs 2.25 times the pixels of 2x and looks the same. A shader that fills every pixel may cap lower, at 1.5.
- Debounce resize by about 120ms and resize the backing store only when its size really changed.

## Dispose

- Give the engine `destroy()`: stop the loop, cancel the frame, remove every listener it added, and drop references.
- Call it from the cleanup of the effect that built the engine. A remount must never leave two loops running.

## WebGL

- A browser keeps about sixteen WebGL contexts per page and silently kills the oldest past that. Mobile browsers keep fewer. A page of these visuals should hold no more than six at once: unmount the farthest from the viewport and show a poster image in its place.
- In `destroy()`, delete programs, shaders, buffers, textures and framebuffers, then call `gl.getExtension("WEBGL_lose_context")?.loseContext()`. With three.js, call `renderer.dispose()` and `renderer.forceContextLoss()`. Otherwise the context lives until garbage collection.
- Listen for `webglcontextlost` on the canvas. Stop the loop there, and show the poster or a still image. Drawing into a lost context does nothing and costs a frame.

## Pointer

- Never call preventDefault on a pointer event the visual only decorates. A finger dragging across the canvas must still scroll the page. Set `touch-action: pan-y` on the canvas instead.
