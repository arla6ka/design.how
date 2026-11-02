export const FRAME_CSS = `
@keyframes bbox-open { from { transform: scale(0, 0); opacity: 0; } to { transform: scale(1, 1); opacity: 1; } }
@keyframes bbox-handle { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes bbox-badge { from { transform: translateX(-50%) scale(0); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  [style*="bbox-open"], [style*="bbox-handle"], [style*="bbox-badge"] { animation: none !important; }
}
`;
