const W = 400;
const H = 500;
const LINE = '#2b2233';

type Draw = (c: CanvasRenderingContext2D) => void;

function outline(c: CanvasRenderingContext2D, fill: string, path: () => void, width = 12) {
  c.beginPath();
  path();
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = LINE;
  c.stroke();
}

function eyes(c: CanvasRenderingContext2D, x1: number, x2: number, y: number, r = 18) {
  for (const x of [x1, x2]) {
    c.beginPath();
    c.ellipse(x, y, r, r * 1.35, 0, 0, Math.PI * 2);
    c.fillStyle = LINE;
    c.fill();
    c.beginPath();
    c.arc(x - r * 0.3, y - r * 0.5, r * 0.36, 0, Math.PI * 2);
    c.fillStyle = '#ffffff';
    c.fill();
  }
}

function smile(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath();
  c.arc(x, y, r, 0.15 * Math.PI, 0.85 * Math.PI);
  c.lineWidth = 10;
  c.lineCap = 'round';
  c.strokeStyle = LINE;
  c.stroke();
}

function cheeks(c: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  c.fillStyle = 'rgba(255, 120, 150, 0.55)';
  for (const x of [x1, x2]) {
    c.beginPath();
    c.ellipse(x, y, 22, 13, 0, 0, Math.PI * 2);
    c.fill();
  }
}

const slime: Draw = c => {
  outline(c, '#74d97f', () => {
    c.moveTo(50, 440);
    c.bezierCurveTo(40, 300, 110, 140, 200, 140);
    c.bezierCurveTo(290, 140, 360, 300, 350, 440);
    c.bezierCurveTo(250, 462, 150, 462, 50, 440);
    c.closePath();
  });
  c.beginPath();
  c.ellipse(140, 220, 26, 44, -0.5, 0, Math.PI * 2);
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.fill();
  eyes(c, 160, 245, 320);
  cheeks(c, 120, 285, 365);
  smile(c, 202, 350, 26);
};

const robot: Draw = c => {
  c.beginPath();
  c.moveTo(200, 120);
  c.lineTo(200, 62);
  c.lineWidth = 12;
  c.strokeStyle = LINE;
  c.stroke();
  outline(c, '#ff5a4f', () => c.arc(200, 52, 20, 0, Math.PI * 2));
  outline(c, '#9fb3c8', () => c.roundRect(60, 330, 50, 100, 22));
  outline(c, '#9fb3c8', () => c.roundRect(290, 330, 50, 100, 22));
  outline(c, '#b7c6d6', () => c.roundRect(110, 300, 180, 160, 28));
  outline(c, '#ffd23f', () => c.arc(200, 380, 30, 0, Math.PI * 2));
  outline(c, '#d6e0ea', () => c.roundRect(70, 120, 260, 190, 40));
  outline(c, '#26364a', () => c.roundRect(105, 155, 190, 120, 26), 8);
  c.fillStyle = '#5cf2e0';
  c.fillRect(145, 190, 30, 36);
  c.fillRect(225, 190, 30, 36);
  c.beginPath();
  c.arc(200, 232, 26, 0.2 * Math.PI, 0.8 * Math.PI);
  c.lineWidth = 8;
  c.strokeStyle = '#5cf2e0';
  c.stroke();
};

const mushroom: Draw = c => {
  outline(c, '#f6e6cb', () => c.roundRect(130, 270, 140, 190, 50));
  outline(c, '#ec4a3f', () => {
    c.moveTo(30, 300);
    c.bezierCurveTo(30, 120, 120, 60, 200, 60);
    c.bezierCurveTo(280, 60, 370, 120, 370, 300);
    c.bezierCurveTo(270, 320, 130, 320, 30, 300);
    c.closePath();
  });
  c.fillStyle = '#fff7ee';
  for (const [x, y, r] of [[120, 170, 30], [215, 115, 24], [290, 200, 34], [190, 225, 20], [80, 255, 16]]) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  eyes(c, 172, 228, 360, 14);
  cheeks(c, 150, 252, 395);
  smile(c, 200, 385, 18);
};

const ghost: Draw = c => {
  outline(c, '#f3f0ff', () => {
    c.moveTo(60, 440);
    c.lineTo(60, 240);
    c.arc(200, 240, 140, Math.PI, 0);
    c.lineTo(340, 440);
    for (let i = 0; i < 4; i++) {
      const x0 = 340 - i * 70;
      c.quadraticCurveTo(x0 - 17.5, 400, x0 - 35, 440);
      c.quadraticCurveTo(x0 - 52.5, 480, x0 - 70, 440);
    }
    c.closePath();
  });
  c.beginPath();
  c.ellipse(130, 200, 18, 40, 0.4, 0, Math.PI * 2);
  c.fillStyle = 'rgba(180, 165, 255, 0.35)';
  c.fill();
  eyes(c, 160, 240, 260, 20);
  cheeks(c, 125, 275, 310);
  c.beginPath();
  c.ellipse(200, 320, 14, 18, 0, 0, Math.PI * 2);
  c.fillStyle = LINE;
  c.fill();
};

const cactus: Draw = c => {
  const arms = () => {
    c.beginPath();
    c.moveTo(150, 260); c.lineTo(110, 260); c.quadraticCurveTo(80, 260, 80, 220); c.lineTo(80, 180);
    c.moveTo(250, 300); c.lineTo(300, 300); c.quadraticCurveTo(330, 300, 330, 260); c.lineTo(330, 200);
  };
  c.lineCap = 'round';
  c.lineJoin = 'round';
  arms();
  c.lineWidth = 56;
  c.strokeStyle = LINE;
  c.stroke();
  arms();
  c.lineWidth = 32;
  c.strokeStyle = '#4fae5b';
  c.stroke();
  outline(c, '#4fae5b', () => c.roundRect(140, 110, 120, 290, 60));
  outline(c, '#ff8fc2', () => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const x = 200 + Math.cos(a) * 18, y = 104 + Math.sin(a) * 18;
      c.moveTo(x + 14, y);
      c.arc(x, y, 14, 0, Math.PI * 2);
    }
  }, 6);
  outline(c, '#d9773f', () => {
    c.moveTo(120, 380);
    c.lineTo(280, 380);
    c.lineTo(258, 470);
    c.lineTo(142, 470);
    c.closePath();
  });
  outline(c, '#e98c55', () => c.roundRect(108, 360, 184, 40, 10));
  eyes(c, 178, 222, 220, 12);
  smile(c, 200, 240, 16);
};

const CAST: Draw[] = [slime, robot, mushroom, ghost, cactus];

export function sprites(): HTMLCanvasElement[] {
  return CAST.map(draw => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx);
    return canvas;
  });
}
