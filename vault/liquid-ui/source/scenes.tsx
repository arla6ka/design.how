import type { CSSProperties, ReactNode } from "react";

export const CARD_VW = 640;
export const CARD_VH = 360;
export const PG_VW = 720;
export const PG_VH = 380;

export const COMPACT_VW = 360;
export const COMPACT_VH = 202;

export const CARD_DIV = 460;
export const PG_DIV = 720;
export const COMPACT_CARD_DIV = 380;
export const COMPACT_PG_DIV = 430;

export const MOBILE_QUERY = "(max-width: 639px)";

export interface ScenePiece {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  content?: ReactNode;
}

export interface SceneSpec {
  k: number;
  cell: number;
  pieces: ScenePiece[];
}

export interface SceneSet {
  vw: number;
  vh: number;
  cardDiv: number;
  pgDiv: number;
  cardRadius: number;
  card: SceneSpec[];
  playground: SceneSpec[];
}

const HOLLOW = "#efefef";
const INK = "#6b6b6b";
const swatch: CSSProperties = { borderRadius: 6, background: HOLLOW };
const bar = (w: string, h: number) => <div style={{ width: w, height: h, borderRadius: 999, background: HOLLOW }} />;
const row = (gap: number, px: number, extra?: CSSProperties): CSSProperties => ({ display: "flex", height: "100%", alignItems: "center", gap, padding: `0 ${px}px`, ...extra });
const lines: CSSProperties = { display: "flex", flex: 1, flexDirection: "column", gap: 6 };

function GridBody(_: { compact?: boolean }) {
  return (
    <div style={{ display: "grid", height: "100%", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 6, padding: "10px 8px 8px" }}>
      <div style={swatch} />
      <div style={swatch} />
      <div style={swatch} />
      <div style={swatch} />
    </div>
  );
}

function Label({ children, compact = false, center = false }: { children: ReactNode; compact?: boolean; center?: boolean }) {
  return (
    <div style={{ display: "flex", height: "100%", alignItems: "center", ...(center ? { justifyContent: "center", paddingLeft: 4 } : { padding: "0 12px 4px" }) }}>
      <span style={{ fontWeight: 600, color: INK, fontSize: compact ? 13 : 11, fontFamily: "var(--visual-sans, system-ui, sans-serif)" }}>{children}</span>
    </div>
  );
}

function BubbleBody({ compact = false }: { compact?: boolean }) {
  const s = compact ? 40 : 36;
  return (
    <div style={row(compact ? 12 : 10, 16)}>
      <div style={{ width: s, height: s, flex: "none", borderRadius: 999, background: HOLLOW }} />
      <div style={lines}>
        {bar("80%", compact ? 10 : 8)}
        {bar("55%", compact ? 10 : 8)}
      </div>
    </div>
  );
}

function ShareBody({ compact = false }: { compact?: boolean }) {
  const s = compact ? 36 : 32;
  const av = (i: number): CSSProperties => ({ width: s, height: s, borderRadius: 999, border: "2px solid #fff", background: HOLLOW, marginLeft: i ? -8 : 0 });
  return (
    <div style={row(12, 16)}>
      <div style={{ display: "flex" }}>
        <div style={av(0)} />
        <div style={av(1)} />
        <div style={av(2)} />
      </div>
      <div style={lines}>
        {bar("70%", compact ? 10 : 8)}
        {bar("45%", compact ? 10 : 8)}
      </div>
    </div>
  );
}

function SearchBody({ compact = false }: { compact?: boolean }) {
  return <div style={row(0, 20)}>{bar("55%", compact ? 12 : 10)}</div>;
}

function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", color: INK }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.2-3.2" />
      </svg>
    </div>
  );
}

const CARD_SCENES: SceneSpec[] = [
  {
    k: 20,
    cell: 6,
    pieces: [
      { id: "main", x: 170, y: 82, w: 300, h: 196, radius: 22, content: <GridBody /> },
      { id: "tab", x: 178, y: 46, w: 92, h: 46, radius: 18, content: <Label>Grid</Label> },
    ],
  },
  {
    k: 30,
    cell: 6,
    pieces: [
      { id: "main", x: 160, y: 128, w: 300, h: 108, radius: 40, content: <BubbleBody /> },
      { id: "tab", x: 428, y: 206, w: 50, h: 50, radius: 14 },
    ],
  },
  {
    k: 60,
    cell: 6,
    pieces: [
      { id: "main", x: 150, y: 120, w: 280, h: 116, radius: 26, content: <ShareBody /> },
      { id: "tab", x: 418, y: 151, w: 90, h: 54, radius: 18, content: <Label center>Share</Label> },
    ],
  },
];

const PG_SCENES: SceneSpec[] = [
  {
    k: 28,
    cell: 12,
    pieces: [
      { id: "bubble", x: 188, y: 123, w: 300, h: 116, radius: 40, content: <BubbleBody /> },
      { id: "tail", x: 472, y: 212, w: 52, h: 52, radius: 14 },
    ],
  },
  {
    k: 20,
    cell: 12,
    pieces: [
      { id: "tab", x: 178, y: 80, w: 92, h: 46, radius: 18, content: <Label>Grid</Label> },
      { id: "panel", x: 247, y: 104, w: 300, h: 196, radius: 22, content: <GridBody /> },
    ],
  },
  {
    k: 77,
    cell: 11,
    pieces: [
      { id: "card", x: 176, y: 131, w: 288, h: 120, radius: 26, content: <ShareBody /> },
      { id: "btn", x: 483, y: 165, w: 96, h: 52, radius: 18, content: <Label center>Share</Label> },
    ],
  },
  {
    k: 20,
    cell: 3,
    pieces: [
      { id: "input", x: 208, y: 167, w: 300, h: 64, radius: 32, content: <SearchBody /> },
      { id: "go", x: 452, y: 132, w: 56, h: 56, radius: 26, content: <SearchIcon /> },
    ],
  },
];

const COMPACT_CARD_SCENES: SceneSpec[] = [
  {
    k: 16,
    cell: 5,
    pieces: [
      { id: "main", x: 76, y: 49, w: 208, h: 132, radius: 20, content: <GridBody compact /> },
      { id: "tab", x: 84, y: 21, w: 78, h: 38, radius: 15, content: <Label compact>Grid</Label> },
    ],
  },
  {
    k: 22,
    cell: 5,
    pieces: [
      { id: "main", x: 64, y: 62, w: 232, h: 92, radius: 32, content: <BubbleBody compact /> },
      { id: "tab", x: 262, y: 128, w: 46, h: 46, radius: 13 },
    ],
  },
  {
    k: 44,
    cell: 5,
    pieces: [
      { id: "main", x: 46, y: 60, w: 210, h: 96, radius: 22, content: <ShareBody compact /> },
      { id: "tab", x: 246, y: 78, w: 74, h: 48, radius: 16, content: <Label compact center>Share</Label> },
    ],
  },
];

const COMPACT_PG_SCENES: SceneSpec[] = [
  {
    k: 22,
    cell: 6,
    pieces: [
      { id: "bubble", x: 52, y: 56, w: 232, h: 92, radius: 32, content: <BubbleBody compact /> },
      { id: "tail", x: 250, y: 120, w: 64, h: 64, radius: 17 },
    ],
  },
  {
    k: 16,
    cell: 6,
    pieces: [
      { id: "tab", x: 60, y: 18, w: 92, h: 64, radius: 20, content: <Label compact>Grid</Label> },
      { id: "panel", x: 96, y: 62, w: 204, h: 122, radius: 20, content: <GridBody compact /> },
    ],
  },
  {
    k: 52,
    cell: 6,
    pieces: [
      { id: "card", x: 40, y: 56, w: 204, h: 100, radius: 22, content: <ShareBody compact /> },
      { id: "btn", x: 242, y: 74, w: 82, h: 64, radius: 20, content: <Label compact center>Share</Label> },
    ],
  },
  {
    k: 16,
    cell: 5,
    pieces: [
      { id: "input", x: 42, y: 80, w: 224, h: 64, radius: 32, content: <SearchBody compact /> },
      { id: "go", x: 238, y: 50, w: 64, h: 64, radius: 29, content: <SearchIcon size={22} /> },
    ],
  },
];

export const DESKTOP_SET: SceneSet = {
  vw: PG_VW,
  vh: PG_VH,
  cardDiv: CARD_DIV,
  pgDiv: PG_DIV,
  cardRadius: 26,
  card: CARD_SCENES,
  playground: PG_SCENES,
};

export const COMPACT_SET: SceneSet = {
  vw: COMPACT_VW,
  vh: COMPACT_VH,
  cardDiv: COMPACT_CARD_DIV,
  pgDiv: COMPACT_PG_DIV,
  cardRadius: 20,
  card: COMPACT_CARD_SCENES,
  playground: COMPACT_PG_SCENES,
};

export const CARD_SPACE = { vw: CARD_VW, vh: CARD_VH };
export const COMPACT_CARD_SPACE = { vw: COMPACT_VW, vh: COMPACT_VH };
