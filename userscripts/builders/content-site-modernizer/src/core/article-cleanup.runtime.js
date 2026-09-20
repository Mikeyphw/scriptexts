function csmNormalizeCleanupText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .trim();
}

function csmTitleTokens(value) {
  const stop = new Set([
    'the', 'and', 'for', 'with', 'from', 'into', 'this', 'that', 'image', 'cover',
    'page', 'preview', 'comic', 'comics', 'issue', 'official', 'full', 'view', 'product'
  ]);
  return csmNormalizeCleanupText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token.length >= 2 && !stop.has(token));
}

function csmTitleTokenOverlap(left, right) {
  const a = new Set(csmTitleTokens(left));
  const b = new Set(csmTitleTokens(right));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size);
}


function csmLooksLikeCompetingProductTitle(value) {
  const text = csmNormalizeCleanupText(value);
  if (text.length < 6 || text.length > 140 || csmTitleTokens(text).length < 2) return false;
  const letters = text.replace(/[^A-Za-z]/g, '');
  const uppercase = letters.replace(/[^A-Z]/g, '').length;
  const uppercaseRatio = letters.length ? uppercase / letters.length : 0;
  return /#\s*\d+/.test(text) || /\b\d+\s*\(\s*OF\s+\d+\s*\)/i.test(text) || uppercaseRatio >= 0.62;
}

function csmShouldHideMismatchedCaption({ mediaLabel, caption, followingTitle }) {
  const media = csmNormalizeCleanupText(mediaLabel);
  const cap = csmNormalizeCleanupText(caption);
  const next = csmNormalizeCleanupText(followingTitle);
  if (media.length < 6 || cap.length < 6 || next.length < 6) return false;
  if (!csmLooksLikeCompetingProductTitle(cap)) return false;
  if (csmTitleTokens(media).length < 2 || csmTitleTokens(next).length < 2) return false;
  const mediaToNext = csmTitleTokenOverlap(media, next);
  const mediaToCaption = csmTitleTokenOverlap(media, cap);
  const captionToNext = csmTitleTokenOverlap(cap, next);
  return mediaToNext >= 0.5 && mediaToCaption < 0.25 && captionToNext < 0.25;
}
