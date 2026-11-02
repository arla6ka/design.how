// Image galaxy: where the template's images and clips come from. FIXED, except MEDIA_BASE.
// Copy the skill's assets/media/ to public/image-galaxy/ (or anywhere the app serves static files) and point MEDIA_BASE at it.
export const MEDIA_BASE = '/image-galaxy';

export function mediaUrl(path: string): string {
  return `${MEDIA_BASE}${path}`;
}

export function videoSources(base: string): {src: string; type: string}[] {
  return [{src: mediaUrl(`${base}.mp4`), type: 'video/mp4'}];
}
