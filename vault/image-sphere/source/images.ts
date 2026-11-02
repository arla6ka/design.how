import { mediaUrl } from "./runtime/media";

export const SPHERE_PATHS = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((n) => `/vault/grid/grid-${n}.webp`);

export const SPHERE_IMAGES = SPHERE_PATHS.map((path) => mediaUrl(path));
