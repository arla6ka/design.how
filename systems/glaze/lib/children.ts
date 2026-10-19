import {isValidElement, type ComponentType, type ReactElement, type ReactNode} from 'react';

const LAZY = Symbol.for('react.lazy');

type MaybeLazy = {$$typeof?: symbol; _init?: (payload: unknown) => unknown; _payload?: unknown};

function resolveType(type: unknown): unknown {
  const lazy = type as MaybeLazy | null;
  if (!lazy || typeof lazy !== 'object' || lazy.$$typeof !== LAZY || !lazy._init) return type;
  try {
    return lazy._init(lazy._payload);
  } catch {
    return null;
  }
}

export function isPart<P>(node: ReactNode, part: ComponentType<P>): node is ReactElement<P> {
  return isValidElement(node) && (node.type === part || resolveType(node.type) === part);
}
