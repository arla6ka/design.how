export interface Pair {
  bg: string;
  fg: string;
  underline?: boolean;
}

export const PAIRS: Pair[] = [
  { bg: "#E8452F", fg: "#2B35C9", underline: true },
  { bg: "#A9A0F5", fg: "#E8722F" },
  { bg: "#6EE87A", fg: "#7A1F14", underline: true },
  { bg: "#4BA3F0", fg: "#BFE6FF" },
  { bg: "#2B35C9", fg: "#E8C93A" },
  { bg: "#1E4620", fg: "#7DE88A" },
  { bg: "#F07838", fg: "#A9A0F5" },
  { bg: "#8FD8FF", fg: "#3A6FE0" },

  { bg: "#F5D93A", fg: "#C2381F", underline: true },
  { bg: "#C94FA8", fg: "#F5E86E" },
  { bg: "#2FA88A", fg: "#F2B5D4" },
  { bg: "#5B45D9", fg: "#79E8C4" },
];

export const UNDERLINE_EVERY = 7;

export function makeStepper(len: number, stride = 5) {
  let i = Math.floor(Math.random() * len);
  return () => {
    i = (i + stride) % len;
    return i;
  };
}
