/* youtube.js — pure YouTube video-ID parsing and thumbnail URL building.
   No DOM, no network. Node-testable (same pattern as manifest-rules.js).

   Verified 2026-08-06:
   - Thumbnail sizes: maxresdefault 1280x720, sddefault 640x480, hqdefault
     480x360, mqdefault 320x180, default 120x90 (paulirish/lite-youtube-embed
     youtube-thumbnail-urls.md + YouTube Data API thumbnail maps).
   - maxresdefault and sddefault are NOT guaranteed to exist. Missing sizes
     return a 120px-wide grey placeholder JPEG (HTTP 404 body still decodes
     as an image, so img.onerror does not fire — detect via naturalWidth).
   - hqdefault exists for every video. */

export var VIDEO_ID_RE = /^[0-9A-Za-z_-]{11}$/;

export var THUMB_SIZES = [
  { key: 'maxresdefault', label: 'Best quality · up to 1080p', tab: 'Best', width: 1280, height: 720 },
  { key: 'sddefault', label: 'Standard · 480p', tab: '480p', width: 640, height: 480 },
  { key: 'hqdefault', label: 'High quality · 360p', tab: '360p', width: 480, height: 360 },
  { key: 'mqdefault', label: 'Medium · 180p', tab: '180p', width: 320, height: 180 },
  { key: 'default', label: 'Default · 144p', tab: '144p', width: 120, height: 90 }
];

export var YT_LIMITS = { title: 100, description: 5000 };

/* One 11-char ID, or a watch link. The ID must always be a single
   11-character token — there is no fuzzy scanning of arbitrary text. */
var URL_PATTERNS = [
  /* /shorts/ID, /live/ID, /embed/ID, /v/ID */
  /(?:youtube\.com|youtube-nocookie\.com)\/(?:shorts|live|embed|v)\/([0-9A-Za-z_-]{11})(?:[#?/)\]]|$)/,
  /* watch?v=ID — v anywhere in the query; covers www./m./music. hosts */
  /(?:^|[./])(?:youtube|youtube-nocookie)\.com\/watch[^#\s]*[?&]v=([0-9A-Za-z_-]{11})(?:[#?&/)\]]|$)/,
  /* youtu.be/ID */
  /(?:^|[./])youtu\.be\/([0-9A-Za-z_-]{11})(?:[#?/)\]]|$)/
];

export function isVideoId(value) {
  return VIDEO_ID_RE.test(value);
}

/* Parse a single line that is either a bare video ID or a YouTube watch
   link. Returns { ok: true, id, kind: 'id'|'url' } or
   { ok: false, reason: 'empty'|'no-id' }. */
export function parseVideoId(input) {
  if (typeof input !== 'string') return { ok: false, reason: 'empty' };
  var raw = input.trim();
  if (!raw) return { ok: false, reason: 'empty' };
  if (VIDEO_ID_RE.test(raw)) return { ok: true, id: raw, kind: 'id' };
  for (var i = 0; i < URL_PATTERNS.length; i++) {
    var m = raw.match(URL_PATTERNS[i]);
    if (m) return { ok: true, id: m[1], kind: 'url' };
  }
  return { ok: false, reason: 'no-id' };
}

export function thumbnailUrl(videoId, sizeKey) {
  var valid = THUMB_SIZES.some(function (s) { return s.key === sizeKey; });
  if (!valid || !VIDEO_ID_RE.test(videoId)) return '';
  return 'https://i.ytimg.com/vi/' + videoId + '/' + sizeKey + '.jpg';
}
