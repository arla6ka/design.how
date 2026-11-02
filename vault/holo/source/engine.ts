import { TILE_IMAGE } from "./tile-image";

export interface Vec {
  x: number;
  y: number;
}

const GLITTER = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27100%27%20height%3D%27100%27%20fill%3D%27%23fff%27%3E%3Cpath%20d%3D%27M34%2015.3L35.7%2019L34%2023.3L33.3%2019Z%27%20opacity%3D%270.54%27%20transform%3D%27rotate%2848%2034%2019%29%27%2F%3E%3Cpath%20d%3D%27M38%207.5L39.3%2011L38%2014.7L37.1%2011Z%27%20opacity%3D%270.52%27%20transform%3D%27rotate%2839%2038%2011%29%27%2F%3E%3Cpath%20d%3D%27M12%2010.6L13.2%2014L12%2017.4L11.1%2014Z%27%20opacity%3D%270.91%27%20transform%3D%27rotate%2811%2012%2014%29%27%2F%3E%3Cpath%20d%3D%27M26%2056.4L27.1%2061L26%2066.1L24.2%2061Z%27%20opacity%3D%270.79%27%20transform%3D%27rotate%2836%2026%2061%29%27%2F%3E%3Cpath%20d%3D%27M92%205.5L93.3%2010L92%2014.7L90.5%2010Z%27%20opacity%3D%270.64%27%20transform%3D%27rotate%2813%2092%2010%29%27%2F%3E%3Cpath%20d%3D%27M16%2028.7L17.7%2033L16%2037.6L15.0%2033Z%27%20opacity%3D%270.59%27%20transform%3D%27rotate%2852%2016%2033%29%27%2F%3E%3Cpath%20d%3D%27M62%2035.0L63.3%2039L62%2042.5L61.1%2039Z%27%20opacity%3D%270.53%27%20transform%3D%27rotate%285%2062%2039%29%27%2F%3E%3Cpath%20d%3D%27M24%2062.5L25.1%2066L24%2069.3L23.1%2066Z%27%20opacity%3D%270.66%27%20transform%3D%27rotate%2853%2024%2066%29%27%2F%3E%3Cpath%20d%3D%27M46%2028.0L47.2%2032L46%2036.8L44.6%2032Z%27%20opacity%3D%270.85%27%20transform%3D%27rotate%2822%2046%2032%29%27%2F%3E%3Cpath%20d%3D%27M57%2047.6L57.9%2052L57%2056.9L55.2%2052Z%27%20opacity%3D%270.86%27%20transform%3D%27rotate%2826%2057%2052%29%27%2F%3E%3Cpath%20d%3D%27M92%2013.0L93.3%2016L92%2019.8L91.2%2016Z%27%20opacity%3D%270.88%27%20transform%3D%27rotate%2814%2092%2016%29%27%2F%3E%3Cpath%20d%3D%27M49%205.4L50.3%209L49%2013.5L47.8%209Z%27%20opacity%3D%270.88%27%20transform%3D%27rotate%2852%2049%209%29%27%2F%3E%3Cpath%20d%3D%27M83%2029.5L84.3%2034L83%2037.8L81.8%2034Z%27%20opacity%3D%270.80%27%20transform%3D%27rotate%2852%2083%2034%29%27%2F%3E%3Cpath%20d%3D%27M46%2075.1L47.6%2080L46%2084.8L44.7%2080Z%27%20opacity%3D%270.74%27%20transform%3D%27rotate%2860%2046%2080%29%27%2F%3E%3C%2Fsvg%3E")`;
const STARS = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27100%27%20height%3D%27100%27%20fill%3D%27%23fff%27%3E%3Ccircle%20cx%3D%2768%27%20cy%3D%2778%27%20r%3D%270.6%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2739%27%20cy%3D%27100%27%20r%3D%270.4%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2726%27%20cy%3D%2726%27%20r%3D%270.5%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2711%27%20cy%3D%2733%27%20r%3D%270.5%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2720%27%20cy%3D%277%27%20r%3D%270.4%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2739%27%20cy%3D%2773%27%20r%3D%270.7%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2710%27%20cy%3D%2773%27%20r%3D%270.7%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2766%27%20cy%3D%2730%27%20r%3D%270.8%27%20opacity%3D%270.8%27%2F%3E%3Ccircle%20cx%3D%2779%27%20cy%3D%2795%27%20r%3D%270.4%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2773%27%20cy%3D%2780%27%20r%3D%270.5%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2763%27%20cy%3D%2710%27%20r%3D%270.7%27%20opacity%3D%270.3%27%2F%3E%3Ccircle%20cx%3D%2745%27%20cy%3D%2748%27%20r%3D%270.4%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2750%27%20cy%3D%2737%27%20r%3D%270.7%27%20opacity%3D%270.8%27%2F%3E%3Ccircle%20cx%3D%2789%27%20cy%3D%2724%27%20r%3D%270.3%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2711%27%20cy%3D%2771%27%20r%3D%270.4%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2728%27%20cy%3D%2740%27%20r%3D%270.7%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2730%27%20cy%3D%2768%27%20r%3D%270.3%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2769%27%20cy%3D%2775%27%20r%3D%270.4%27%20opacity%3D%270.3%27%2F%3E%3Ccircle%20cx%3D%2751%27%20cy%3D%2766%27%20r%3D%270.3%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2727%27%20cy%3D%279%27%20r%3D%270.4%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2747%27%20cy%3D%2711%27%20r%3D%270.6%27%20opacity%3D%270.8%27%2F%3E%3Ccircle%20cx%3D%2768%27%20cy%3D%277%27%20r%3D%270.6%27%20opacity%3D%270.7%27%2F%3E%3Ccircle%20cx%3D%271%27%20cy%3D%2738%27%20r%3D%270.6%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2793%27%20cy%3D%2757%27%20r%3D%270.6%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2721%27%20cy%3D%2751%27%20r%3D%270.3%27%20opacity%3D%270.8%27%2F%3E%3Ccircle%20cx%3D%2765%27%20cy%3D%2721%27%20r%3D%270.4%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2775%27%20cy%3D%2714%27%20r%3D%270.5%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2726%27%20cy%3D%2788%27%20r%3D%270.7%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2764%27%20cy%3D%2768%27%20r%3D%270.4%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2743%27%20cy%3D%2748%27%20r%3D%270.3%27%20opacity%3D%270.8%27%2F%3E%3Ccircle%20cx%3D%2715%27%20cy%3D%2746%27%20r%3D%270.8%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2787%27%20cy%3D%2726%27%20r%3D%270.5%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2732%27%20cy%3D%2737%27%20r%3D%270.5%27%20opacity%3D%270.8%27%2F%3E%3Ccircle%20cx%3D%2797%27%20cy%3D%279%27%20r%3D%270.6%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2741%27%20cy%3D%274%27%20r%3D%270.5%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2737%27%20cy%3D%2759%27%20r%3D%270.5%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2727%27%20cy%3D%2798%27%20r%3D%270.5%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2717%27%20cy%3D%2766%27%20r%3D%270.6%27%20opacity%3D%270.7%27%2F%3E%3Ccircle%20cx%3D%2751%27%20cy%3D%2787%27%20r%3D%271.6%27%20opacity%3D%27.95%27%2F%3E%3Ccircle%20cx%3D%275%27%20cy%3D%2768%27%20r%3D%271.6%27%20opacity%3D%27.95%27%2F%3E%3Ccircle%20cx%3D%2725%27%20cy%3D%2773%27%20r%3D%271.8%27%20opacity%3D%27.95%27%2F%3E%3Ccircle%20cx%3D%2728%27%20cy%3D%2715%27%20r%3D%271.4%27%20opacity%3D%27.95%27%2F%3E%3Ccircle%20cx%3D%2759%27%20cy%3D%2744%27%20r%3D%271.3%27%20opacity%3D%27.95%27%2F%3E%3Ccircle%20cx%3D%2745%27%20cy%3D%2755%27%20r%3D%271.6%27%20opacity%3D%27.95%27%2F%3E%3C%2Fsvg%3E")`;
const GRAIN = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27120%27%20height%3D%27120%27%3E%3Cfilter%20id%3D%27n%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%27.85%27%20numOctaves%3D%273%27%20stitchTiles%3D%27stitch%27%2F%3E%3CfeColorMatrix%20type%3D%27saturate%27%20values%3D%270%27%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%27120%27%20height%3D%27120%27%20filter%3D%27url%28%23n%29%27%20opacity%3D%27.4%27%2F%3E%3C%2Fsvg%3E")`;

export const SUNPILLARS = [
  "hsl(2, 100%, 73%)",
  "hsl(53, 100%, 69%)",
  "hsl(93, 100%, 69%)",
  "hsl(176, 100%, 76%)",
  "hsl(228, 100%, 74%)",
  "hsl(283, 100%, 73%)",
];

const S = SUNPILLARS;

function rainbow(angle: string, space: string, hues: string[] = S): string {
  const stops = hues
    .map((c, i) => `${c} calc(${space} * ${i + 1})`)
    .concat(`${hues[0]} calc(${space} * ${hues.length + 1})`)
    .join(", ");
  return `repeating-linear-gradient(${angle}, ${stops})`;
}

export interface Layer {
  img: string;
  size: string;
  rate: number;
  bgBlend?: string;
  blend: string;
  filter: string;
  base: number;
  gain: number;
}

export interface Foil {
  key: string;
  label: string;
  layers: Layer[];
  parallax: number;
  bloom: number;
  glare: number;
}

export const FOILS: Foil[] = [
  {
    key: "holo",
    label: "Holo",
    layers: [
      {
        img: rainbow("10deg", "8%"),
        size: "380% 380%",
        rate: 1,
        blend: "overlay",
        filter: "brightness(1.08) contrast(2.3) saturate(1.5)",
        base: 0.26,
        gain: 0.6,
      },
      {
        img: rainbow("104deg", "13%"),
        size: "300% 300%",
        rate: -0.7,
        blend: "color-dodge",
        filter: "brightness(.82) contrast(2) saturate(1.7)",
        base: 0.14,
        gain: 0.34,
      },
      {
        img:
          "repeating-linear-gradient(96deg, rgba(255,255,255,.5) 0px, rgba(255,255,255,0) 2px, rgba(0,0,0,.16) 3px, rgba(255,255,255,0) 5px)",
        size: "auto",
        rate: 1.8,
        blend: "overlay",
        filter: "contrast(1.3)",
        base: 0.1,
        gain: 0.26,
      },
    ],
    parallax: 0.26,
    bloom: 0.55,
    glare: 0.55,
  },
  {
    key: "glitter",
    label: "Glitter",
    layers: [
      {
        img: `${GLITTER}, ${GLITTER}`,
        size: "26% 26%, 19% 19%",
        rate: 0.5,
        bgBlend: "soft-light",
        blend: "color-dodge",
        filter: "brightness(1.1) contrast(1.6) saturate(1.2)",
        base: 0.3,
        gain: 0.55,
      },
      {
        img: rainbow("122deg", "13%"),
        size: "320% 320%",
        rate: 1.4,
        blend: "overlay",
        filter: "brightness(1) contrast(2) saturate(.8)",
        base: 0.16,
        gain: 0.34,
      },
    ],
    parallax: 0.3,
    bloom: 0.6,
    glare: 0.6,
  },
  {
    key: "prism",
    label: "Prism",
    layers: [
      {
        img:
          "repeating-linear-gradient(45deg, hsl(0,0%,10%) 0%, hsl(0,0%,22%) 1.4%, hsl(0,0%,42%) 2.6%, hsl(0,0%,50%) 3.4%, hsl(0,0%,32%) 4.6%, hsl(0,0%,8%) 6%), " +
          "repeating-linear-gradient(-45deg, hsl(0,0%,10%) 0%, hsl(0,0%,24%) 1.6%, hsl(0,0%,46%) 3%, hsl(0,0%,52%) 3.8%, hsl(0,0%,28%) 5.2%, hsl(0,0%,8%) 6.6%)",
        size: "210% 210%, 190% 190%",
        rate: 1.5,
        bgBlend: "exclusion",
        blend: "color-dodge",
        filter: "brightness(.62) contrast(2.2) saturate(1.6)",
        base: 0.3,
        gain: 0.5,
      },
      {
        img: rainbow("55deg", "16%"),
        size: "400% 100%",
        rate: -2.5,
        blend: "color-dodge",
        filter: "brightness(.6) contrast(2.4) saturate(1.7)",
        base: 0.2,
        gain: 0.4,
      },
    ],
    parallax: 0.24,
    bloom: 0.55,
    glare: 0.52,
  },
  {
    key: "conic",
    label: "Conic",
    layers: [
      {
        img: `conic-gradient(from var(--spin, 0deg) at 50% 50%, ${S[3]}, ${S[4]}, ${S[5]}, ${S[0]}, ${S[1]}, ${S[2]}, ${S[3]})`,
        size: "cover",
        rate: 0,
        blend: "color-dodge",
        filter: "brightness(.55) contrast(1.5) saturate(2.4)",
        base: 0.22,
        gain: 0.42,
      },
      {
        img: `${GLITTER}, ${GLITTER}`,
        size: "24% 24%, 17% 17%",
        rate: 0.7,
        bgBlend: "hard-light",
        blend: "color-dodge",
        filter: "brightness(1.05) contrast(1.5)",
        base: 0.26,
        gain: 0.5,
      },
    ],
    parallax: 0.22,
    bloom: 0.5,
    glare: 0.58,
  },
  {
    key: "cosmos",
    label: "Cosmos",
    layers: [
      {
        img: `${STARS}, ${rainbow("82deg", "8%")}`,
        size: "38% 38%, 420% 900%",
        rate: 0.35,
        bgBlend: "color-burn",
        blend: "color-dodge",
        filter: "brightness(1) contrast(1.6) saturate(.9)",
        base: 0.28,
        gain: 0.45,
      },
      {
        img: STARS,
        size: "22% 22%",
        rate: 1.6,
        blend: "overlay",
        filter: "brightness(1.3) contrast(1.7)",
        base: 0.2,
        gain: 0.4,
      },
      {
        img: STARS,
        size: "13% 13%",
        rate: 2.6,
        blend: "overlay",
        filter: "brightness(1.1) contrast(1.5)",
        base: 0.12,
        gain: 0.3,
      },
    ],
    parallax: 0.34,
    bloom: 0.55,
    glare: 0.46,
  },
  {
    key: "rainbow",
    label: "Rainbow",
    layers: [
      {
        img: rainbow("0deg", "14%", [
          "hsla(283,49%,60%,.75)",
          "hsla(2,70%,58%,.75)",
          "hsla(53,67%,53%,.75)",
          "hsla(93,56%,52%,.75)",
          "hsla(176,38%,50%,.75)",
          "hsla(228,100%,77%,.75)",
        ]),
        size: "200% 400%",
        rate: 1,
        blend: "color-dodge",
        filter: "brightness(.9) contrast(2.6) saturate(1.6)",
        base: 0.24,
        gain: 0.44,
      },
      {
        img:
          "linear-gradient(-30deg, hsl(0,57%,37%), hsl(40,53%,39%), hsl(90,60%,35%), hsl(180,60%,35%), hsl(210,57%,39%), hsl(280,55%,31%), hsl(0,57%,37%))",
        size: "400% 400%",
        rate: -1.5,
        blend: "color-dodge",
        filter: "brightness(1.1) contrast(2) saturate(1.2)",
        base: 0.3,
        gain: -0.18,
      },
    ],
    parallax: 0.3,
    bloom: 0.5,
    glare: 0.5,
  },
  {
    key: "refractor",
    label: "Refractor",
    layers: [
      {
        img: rainbow("125deg", "7%", [
          "hsl(176,100%,76%)",
          "hsl(196,100%,78%)",
          "hsl(214,100%,76%)",
          "hsl(228,100%,74%)",
          "hsl(200,100%,80%)",
          "hsl(168,100%,78%)",
        ]),
        size: "200% 700%",
        rate: 1.2,
        blend: "color-dodge",
        filter: "brightness(.7) contrast(1.8) saturate(1.9)",
        base: 0.22,
        gain: 0.4,
      },
      {
        img:
          "repeating-linear-gradient(100deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 1.2%, rgba(0,0,0,.25) 2.2%, rgba(255,255,255,0) 3.4%)",
        size: "300% 100%",
        rate: -0.8,
        blend: "hard-light",
        filter: "brightness(1.05) contrast(1.4)",
        base: 0.18,
        gain: 0.36,
      },
    ],
    parallax: 0.18,
    bloom: 0.55,
    glare: 0.64,
  },
  {
    key: "velvet",
    label: "Velvet",
    layers: [
      {
        img: `${rainbow("-33deg", "6%")}, ${rainbow("133deg", "3%", ["hsla(227,53%,12%,.5)", "hsl(180,10%,50%)", "hsl(83,50%,35%)", "hsl(180,10%,50%)", "hsla(227,53%,12%,.5)", "hsla(227,53%,12%,.5)"])}`,
        size: "1100% 1100%, 600% 600%",
        rate: 1,
        bgBlend: "difference",
        blend: "color-dodge",
        filter: "brightness(.75) contrast(2) saturate(1.1)",
        base: 0.3,
        gain: 0.48,
      },
      {
        img:
          "radial-gradient(farthest-corner circle at var(--gx,50%) var(--gy,50%), hsla(189,76%,77%,.6) 0%, hsla(147,59%,77%,.6) 25%, hsla(271,55%,69%,.6) 50%, hsla(355,56%,72%,.6) 75%)",
        size: "200% 200%",
        rate: 0.4,
        blend: "soft-light",
        filter: "saturate(1.5)",
        base: 0.4,
        gain: 0.3,
      },
    ],
    parallax: 0.28,
    bloom: 0.6,
    glare: 0.5,
  },
  {
    key: "ice",
    label: "Ice",
    layers: [
      {
        img: rainbow("115deg", "10%", [
          "hsl(190,90%,80%)",
          "hsl(210,85%,82%)",
          "hsl(230,80%,80%)",
          "hsl(250,70%,82%)",
          "hsl(200,90%,85%)",
          "hsl(175,80%,82%)",
        ]),
        size: "300% 300%",
        rate: 1.1,
        blend: "exclusion",
        filter: "brightness(.8) contrast(1.6) saturate(1.3)",
        base: 0.12,
        gain: 0.22,
      },
      {
        img: `${GRAIN}, ${GLITTER}`,
        size: "38% 38%, 22% 22%",
        rate: 0.6,
        bgBlend: "overlay",
        blend: "hard-light",
        filter: "brightness(1.1) contrast(1.3)",
        base: 0.18,
        gain: 0.34,
      },
    ],
    parallax: 0.2,
    bloom: 0.5,
    glare: 0.62,
  },
  {
    key: "brushed",
    label: "Brushed",
    layers: [
      {
        img: rainbow("94deg", "4%", [
          "hsl(30,40%,86%)",
          "hsl(200,30%,88%)",
          "hsl(260,25%,87%)",
          "hsl(180,25%,89%)",
          "hsl(40,30%,88%)",
          "hsl(220,25%,87%)",
        ]),
        size: "260% 260%",
        rate: 0.8,
        blend: "soft-light",
        filter: "brightness(1.02) contrast(1.7) saturate(.55)",
        base: 0.34,
        gain: 0.3,
      },
      {
        img: GRAIN,
        size: "34% 34%",
        rate: 0.3,
        blend: "overlay",
        filter: "brightness(1) contrast(1.1)",
        base: 0.14,
        gain: 0.16,
      },
    ],
    parallax: 0.13,
    bloom: 0.32,
    glare: 0.34,
  },
];

export const MAX_TILT = 14;

export function adjust(
  v: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
): number {
  return toMin + ((toMax - toMin) * (v - fromMin)) / (fromMax - fromMin);
}

export function clamp(v: number, min = -1, max = 1): number {
  return Math.min(Math.max(v, min), max);
}

export class Follow {
  value: Vec = { x: 0, y: 0 };
  target: Vec = { x: 0, y: 0 };
  velocity: Vec = { x: 0, y: 0 };
  speed = 0;

  constructor(private stiffness: number) {}

  step() {
    const px = this.value.x;
    const py = this.value.y;
    this.value.x += (this.target.x - this.value.x) * this.stiffness;
    this.value.y += (this.target.y - this.value.y) * this.stiffness;
    this.velocity.x = this.value.x - px;
    this.velocity.y = this.value.y - py;
    const raw = Math.min(1, Math.hypot(this.velocity.x, this.velocity.y) * 14);
    this.speed += (raw - this.speed) * (raw > this.speed ? 0.45 : 0.06);
  }

  get settled(): boolean {
    return (
      Math.abs(this.target.x - this.value.x) < 0.0006 &&
      Math.abs(this.target.y - this.value.y) < 0.0006 &&
      this.speed < 0.004
    );
  }
}

export class Kick {
  private amount: Vec = { x: 0, y: 0 };
  private life = 0;

  fire(v: Vec, gain = 2.6) {
    const mag = Math.hypot(v.x, v.y);
    if (mag < 0.002) return;
    this.amount = { x: v.x * gain, y: v.y * gain };
    this.life = 1;
  }

  step(): Vec {
    if (this.life <= 0) return { x: 0, y: 0 };
    this.life = Math.max(0, this.life - 0.035);
    const e = Math.sin(this.life * Math.PI) * this.life;
    return { x: this.amount.x * e, y: this.amount.y * e };
  }

  get active(): boolean {
    return this.life > 0;
  }
}

export class Orientation {
  private base: { beta: number; gamma: number } | null = null;
  private range = 22;

  read(e: DeviceOrientationEvent): Vec | null {
    const beta = e.beta;
    const gamma = e.gamma;
    if (beta == null || gamma == null) return null;
    if (!this.base) {
      this.base = { beta, gamma };
      return { x: 0, y: 0 };
    }
    return {
      x: clamp((gamma - this.base.gamma) / this.range),
      y: clamp((beta - this.base.beta) / this.range),
    };
  }

  reset() {
    this.base = null;
  }
}

export function fromPointer(rect: DOMRect, cx: number, cy: number): Vec {
  return {
    x: clamp(((cx - rect.left) / rect.width) * 2 - 1),
    y: clamp(((cy - rect.top) / rect.height) * 2 - 1),
  };
}

export interface Live {
  parallax: number;
  bloom: number;
}

export interface Motion {
  speed?: number;
  velocity?: Vec;
  time?: number;
}

export function applyFrame(
  card: HTMLElement,
  tilt: Vec,
  sheet: Vec,
  foil: Foil,
  live: Live,
  motion: Motion = {},
): void {
  const { x, y } = tilt;
  const s = card.style;

  s.setProperty("--rx", `${(-y * MAX_TILT).toFixed(2)}deg`);
  s.setProperty("--ry", `${(x * MAX_TILT).toFixed(2)}deg`);

  const p = live.parallax;

  for (let i = 0; i < LAYER_SLOTS; i++) {
    const L = foil.layers[i];
    if (!L) continue;
    const t = p * L.rate;
    const n = `--l${i + 1}`;
    s.setProperty(`${n}-x`, `${adjust(sheet.x, -1, 1, 50 - t * 100, 50 + t * 100).toFixed(1)}%`);
    s.setProperty(`${n}-y`, `${adjust(sheet.y, -1, 1, 50 - t * 100, 50 + t * 100).toFixed(1)}%`);
  }

  const off = Math.min(1, Math.hypot(x, y));
  s.setProperty("--off", off.toFixed(3));

  const softOff = Math.min(1, Math.hypot(sheet.x, sheet.y));
  const HEART_FROM = 0.34;
  const t = Math.max(0, Math.min(1, (softOff - HEART_FROM) / (1 - HEART_FROM)));
  s.setProperty("--reveal", (t * t * (3 - 2 * t) * 0.9).toFixed(3));

  const ang = Math.atan2(sheet.y, sheet.x) * (180 / Math.PI);
  s.setProperty("--reveal-angle", `${(ang + 90).toFixed(0)}deg`);
  s.setProperty("--reveal-x", `${adjust(sheet.x, -1, 1, 78, 22).toFixed(1)}%`);
  s.setProperty("--reveal-y", `${adjust(sheet.y, -1, 1, 78, 22).toFixed(1)}%`);

  const SPOT = { x: -0.42, y: -0.36 };
  const dSpot = Math.hypot(sheet.x - SPOT.x, sheet.y - SPOT.y);
  const hit = Math.max(0, 1 - dSpot / 0.34);
  const spotBloom = hit * hit * (3 - 2 * hit);

  const breathNow =
    0.5 +
    0.5 * Math.sin((motion.time ?? 0) * 0.5) * Math.cos((motion.time ?? 0) * 0.31);

  for (let i = 0; i < LAYER_SLOTS; i++) {
    const L = foil.layers[i];
    if (!L) continue;
    let o = Math.max(0, L.base + off * L.gain * (live.bloom / 0.5));
    o *= 1 + spotBloom * 0.85;
    o *= 0.94 + breathNow * 0.06;
    s.setProperty(`--l${i + 1}-o`, Math.min(1, o).toFixed(3));
  }

  s.setProperty("--spin", `${(sheet.x * 90 + sheet.y * 45).toFixed(1)}deg`);

  s.setProperty("--gx", `${adjust(x, -1, 1, 12, 88).toFixed(1)}%`);
  s.setProperty("--gy", `${adjust(y, -1, 1, 12, 88).toFixed(1)}%`);

  s.setProperty("--tile-x", `${adjust(sheet.x, -1, 1, 58, 42).toFixed(1)}%`);

  const FLIP_FROM = 0.52;
  const flip = Math.max(0, Math.min(1, (softOff - FLIP_FROM) / (1 - FLIP_FROM)));
  s.setProperty("--tile-invert", flip.toFixed(3));
  s.setProperty("--tile-hue", `${(150 + flip * 120).toFixed(0)}deg`);
  s.setProperty(
    "--tile-sweep-angle",
    `${(Math.atan2(sheet.y, sheet.x) * (180 / Math.PI) + 90).toFixed(0)}deg`,
  );

  const speed = motion.speed ?? 0;
  const vel = motion.velocity ?? { x: 0, y: 0 };

  s.setProperty("--speed", speed.toFixed(3));

  const vmag = Math.hypot(vel.x, vel.y);
  if (vmag > 0.0001) {
    s.setProperty(
      "--smear-angle",
      `${(Math.atan2(vel.y, vel.x) * (180 / Math.PI)).toFixed(0)}deg`,
    );
  }
  s.setProperty("--smear", (Math.min(1, speed) * 0.8).toFixed(3));

  s.setProperty("--spot", spotBloom.toFixed(3));

  s.setProperty("--emboss-x", `${(-x * 0.9).toFixed(2)}px`);
  s.setProperty("--emboss-y", `${(-y * 0.9).toFixed(2)}px`);

  s.setProperty("--edge-l", Math.max(0, -x).toFixed(3));
  s.setProperty("--edge-r", Math.max(0, x).toFixed(3));
  s.setProperty("--edge-t", Math.max(0, -y).toFixed(3));
  s.setProperty("--edge-b", Math.max(0, y).toFixed(3));

  s.setProperty("--breath", breathNow.toFixed(3));

}

const BODY = ["#ffd9e8", "#fcc2dc", "#f7aecf", "#f9bcc9"];
const TILE: [string, string] = ["#8e3a63", "#f0d3e2"];

export const LAYER_SLOTS = 3;

export function applyFoil(card: HTMLElement, foil: Foil): void {
  const s = card.style;
  s.setProperty("--tile-src", `url("${TILE_IMAGE}")`);
  s.setProperty("--body-grad", `linear-gradient(115deg, ${BODY.join(", ")})`);
  s.setProperty("--tile-dark", TILE[0]);
  s.setProperty("--tile-light", TILE[1]);
  s.setProperty("--glare-o", `${foil.glare}`);

  for (let i = 0; i < LAYER_SLOTS; i++) {
    const n = `--l${i + 1}`;
    const L = foil.layers[i];
    if (!L) {
      s.setProperty(`${n}-img`, "none");
      s.setProperty(`${n}-o`, "0");
      continue;
    }
    s.setProperty(`${n}-img`, L.img);
    s.setProperty(`${n}-size`, L.size);
    s.setProperty(`${n}-bgblend`, L.bgBlend ?? "normal");
    s.setProperty(`${n}-blend`, L.blend);
    s.setProperty(`${n}-filter`, L.filter);
  }
}
