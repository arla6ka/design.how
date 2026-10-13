export const kinds = ['agent', 'key', 'run', 'deploy', 'model'] as const;
export type Kind = (typeof kinds)[number];

export const reserved = ['warn', 'fail'] as const;
export type Reserved = (typeof reserved)[number];
