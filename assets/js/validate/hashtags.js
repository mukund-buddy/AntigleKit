/* hashtags.js — pure YouTube hashtag normalization.
   No DOM, no network. Node-testable.

   Rules (YouTube Help 6390658): hashtags are written #tag without spaces;
   multi-word tags become #CamelCase. The first three hashtags in the
   description can appear above the video title — extras still work in
   search but are not displayed that way. */

/* Single token -> "#CamelCase" body, e.g. "minecraft builds" -> "MinecraftBuilds".
   Keeps letters, digits, underscores; splits on most other punctuation.
   Returns null when nothing usable remains. */
export function normalizeHashtag(token) {
  if (typeof token !== 'string') return null;
  var t = String(token).trim().replace(/^#+/, '');
  if (!t) return null;
  var words = t.split(/[\s,./\\:;()|&+\-]+/).filter(Boolean);
  var parts = [];
  for (var i = 0; i < words.length; i++) {
    var clean = words[i].replace(/[^0-9A-Za-z_]/g, '');
    if (!clean) continue;
    parts.push(clean.charAt(0).toUpperCase() + clean.slice(1));
  }
  return parts.length ? parts.join('') : null;
}

/* Split a whole text block into tags. Tags are separated by commas,
   semicolons or line breaks. A "#" inside a chunk acts as an extra tag
   boundary ("#a #b" becomes two tags); spaces within a chunk make one
   camel-cased tag ("minecraft builds"). */
export function splitTagTokens(text) {
  var chunks = String(text == null ? '' : text).split(/[\n,;]+/);
  var out = [];
  for (var i = 0; i < chunks.length; i++) {
    var chunk = chunks[i].trim();
    if (!chunk) continue;
    if (chunk.indexOf('#') !== -1) {
      var pieces = chunk.split('#');
      for (var j = 0; j < pieces.length; j++) {
        if (pieces[j].trim()) out.push(pieces[j].trim());
      }
    } else {
      out.push(chunk);
    }
  }
  return out;
}

export function normalizeHashtags(text) {
  var tokens = splitTagTokens(text);
  var seen = Object.create(null);
  var tags = [];
  var issues = [];
  for (var i = 0; i < tokens.length; i++) {
    var tag = normalizeHashtag(tokens[i]);
    if (!tag) {
      issues.push({ code: 'unreadable', message: 'Could not read a hashtag from "' + tokens[i] + '".' });
      continue;
    }
    var key = tag.toLowerCase();
    if (seen[key]) {
      issues.push({ code: 'duplicate', message: 'Removed duplicate #' + tag + '.' });
      continue;
    }
    seen[key] = true;
    tags.push(tag);
  }
  var withHash = tags.map(function (t) { return '#' + t; });
  return {
    tags: tags,
    lines: withHash,
    inline: withHash.join(' '),
    count: tags.length,
    charsNoHash: tags.join('').length,
    charsWithHash: withHash.join(' ').length,
    issues: issues
  };
}
