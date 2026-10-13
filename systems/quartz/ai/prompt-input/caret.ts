const ZERO_WIDTH = /​/g;

const isChip = (node: Node | null | undefined): node is HTMLElement => node instanceof HTMLElement && !!node.dataset.mentionId;

function chipAtCaret(editor: HTMLElement | null, direction: 'back' | 'forward'): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selection.isCollapsed) return null;
  const {anchorNode: node, anchorOffset: offset} = selection;
  if (!node || !editor?.contains(node)) return null;
  let sibling: Node | null = null;
  if (node.nodeType === Node.TEXT_NODE) {
    const data = (node as Text).data;
    if (direction === 'back' && data.slice(0, offset).replace(ZERO_WIDTH, '') !== '') return null;
    if (direction === 'forward' && data.slice(offset).replace(ZERO_WIDTH, '') !== '') return null;
    sibling = direction === 'back' ? node.previousSibling : node.nextSibling;
  } else {
    sibling = direction === 'back' ? node.childNodes[offset - 1] ?? null : node.childNodes[offset] ?? null;
  }
  while (sibling && sibling.nodeType === Node.TEXT_NODE && !(sibling as Text).data.replace(ZERO_WIDTH, '')) {
    sibling = direction === 'back' ? sibling.previousSibling : sibling.nextSibling;
  }
  return isChip(sibling) ? sibling : null;
}

function caretAt(place: 'before' | 'after', node: Node) {
  const range = document.createRange();
  if (place === 'before') range.setStartBefore(node); else range.setStartAfter(node);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function caretAtEnd(node: Node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export {isChip, chipAtCaret, caretAt, caretAtEnd};
