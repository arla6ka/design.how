export type GlyphDraw = (ctx: CanvasRenderingContext2D, s: number) => void;

const C = 16;

export const GLYPHS: { name: string; draw: GlyphDraw }[] = [
  { name: "empty", draw: () => {} },

  {
    name: "dot",
    draw: (ctx) => {
      ctx.beginPath();
      ctx.arc(C, C, 5, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    name: "ring",
    draw: (ctx) => {
      ctx.beginPath();
      ctx.arc(C, C, 9, 0, Math.PI * 2);
      ctx.arc(C, C, 5.5, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
    },
  },
  {
    name: "square",
    draw: (ctx) => {
      ctx.fillRect(C - 7, C - 7, 14, 14);
    },
  },
  {
    name: "frame",
    draw: (ctx) => {
      ctx.beginPath();
      ctx.rect(C - 9, C - 9, 18, 18);
      ctx.rect(C - 5, C - 5, 10, 10);
      ctx.fill("evenodd");
    },
  },
  {
    name: "diagonal",
    draw: (ctx) => {
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(6, 26);
      ctx.lineTo(26, 6);
      ctx.stroke();
    },
  },
  {
    name: "cross",
    draw: (ctx) => {
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(7, 7);
      ctx.lineTo(25, 25);
      ctx.moveTo(25, 7);
      ctx.lineTo(7, 25);
      ctx.stroke();
    },
  },
  {
    name: "plus",
    draw: (ctx) => {
      ctx.fillRect(C - 2.5, 5, 5, 22);
      ctx.fillRect(5, C - 2.5, 22, 5);
    },
  },
  {
    name: "chevron",
    draw: (ctx) => {
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(8, 10);
      ctx.lineTo(C, 22);
      ctx.lineTo(24, 10);
      ctx.stroke();
    },
  },
  {
    name: "triangle",
    draw: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(C, 6);
      ctx.lineTo(26, 25);
      ctx.lineTo(6, 25);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    name: "diamond",
    draw: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(C, 5);
      ctx.lineTo(27, C);
      ctx.lineTo(C, 27);
      ctx.lineTo(5, C);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    name: "bars",
    draw: (ctx) => {
      ctx.fillRect(7, 6, 4, 20);
      ctx.fillRect(14, 6, 4, 20);
      ctx.fillRect(21, 6, 4, 20);
    },
  },
  {
    name: "hexagon",
    draw: (ctx) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const x = C + Math.cos(a) * 11;
        const y = C + Math.sin(a) * 11;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    name: "star",
    draw: (ctx) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 12 : 5;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const x = C + Math.cos(a) * r;
        const y = C + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    name: "heart",
    draw: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(16, 26);
      ctx.bezierCurveTo(2, 16, 6, 6, 16, 12);
      ctx.bezierCurveTo(26, 6, 30, 16, 16, 26);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    name: "drop",
    draw: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(16, 5);
      ctx.bezierCurveTo(24, 15, 26, 20, 16, 27);
      ctx.bezierCurveTo(6, 20, 8, 15, 16, 5);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    name: "flower",
    draw: (ctx) => {
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        ctx.beginPath();
        ctx.ellipse(C + Math.cos(a) * 7, C + Math.sin(a) * 7, 4.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    name: "asterisk",
    draw: (ctx) => {
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI / 3) * i;
        ctx.beginPath();
        ctx.moveTo(C - Math.cos(a) * 11, C - Math.sin(a) * 11);
        ctx.lineTo(C + Math.cos(a) * 11, C + Math.sin(a) * 11);
        ctx.stroke();
      }
    },
  },
  {
    name: "spark",
    draw: (ctx) => {
      ctx.beginPath();
      const pts = [
        [16, 3], [19, 13], [29, 16], [19, 19],
        [16, 29], [13, 19], [3, 16], [13, 13],
      ];
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    name: "pentagon",
    draw: (ctx) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
        const x = C + Math.cos(a) * 11;
        const y = C + Math.sin(a) * 11;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    name: "donut",
    draw: (ctx) => {
      ctx.beginPath();
      ctx.arc(C, C, 11, 0, Math.PI * 2);
      ctx.arc(C, C, 4, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
    },
  },
  {
    name: "halfmoon",
    draw: (ctx) => {
      ctx.beginPath();
      ctx.arc(C, C, 11, 0, Math.PI * 2);
      ctx.arc(C + 6, C - 3, 10, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
    },
  },
  {
    name: "arrow",
    draw: (ctx) => {
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(7, 16);
      ctx.lineTo(23, 16);
      ctx.moveTo(16, 9);
      ctx.lineTo(23, 16);
      ctx.lineTo(16, 23);
      ctx.stroke();
    },
  },
  {
    name: "wave",
    draw: (ctx) => {
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(5, 16);
      ctx.quadraticCurveTo(11, 7, 16, 16);
      ctx.quadraticCurveTo(21, 25, 27, 16);
      ctx.stroke();
    },
  },
];

export function glyphCanvas(index: number, size = 64): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  const g = GLYPHS[index];
  if (g) {
    const scale = size / 32;
    ctx.save();
    ctx.scale(scale, scale);
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#000";
    g.draw(ctx, 32);
    ctx.restore();
  }
  return c;
}
