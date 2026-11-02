// Realistic emboss: where the template's images and clips come from. FIXED, except MEDIA_BASE.
// Copy the skill's assets/media/ to public/emboss/ (or anywhere the app serves static files) and point MEDIA_BASE at it.
export const MEDIA_BASE = '/emboss';

export function mediaUrl(path: string): string {
  return `${MEDIA_BASE}${path}`;
}

export function videoSources(base: string): {src: string; type: string}[] {
  return [{src: mediaUrl(`${base}.mp4`), type: 'video/mp4'}];
}
