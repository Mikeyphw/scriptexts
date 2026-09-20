function csmFeedVariantForIndex(index, featuredCount = 1) {
  const safeIndex = Number.isFinite(Number(index)) ? Math.max(0, Math.trunc(Number(index))) : 0;
  const count = Number.isFinite(Number(featuredCount)) ? Math.max(0, Math.trunc(Number(featuredCount))) : 0;
  return safeIndex < count ? 'featured' : 'standard';
}

function csmInteractionProfile({
  userAgent = '',
  coarsePointer = false,
  anyCoarsePointer = false,
  maxTouchPoints = 0,
  width = Number.POSITIVE_INFINITY,
  breakpoint = 760
} = {}) {
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(String(userAgent || ''));
  const primaryCoarse = Boolean(coarsePointer);
  const anyCoarse = Boolean(anyCoarsePointer);
  const touchPoints = Math.max(0, Number(maxTouchPoints) || 0);
  const viewport = Number(width);
  const cutoff = Math.max(320, Number(breakpoint) || 760);
  const narrowTouch = touchPoints > 0 && Number.isFinite(viewport) && viewport <= cutoff;
  const boundedHybridTouch = anyCoarse && touchPoints > 0 && Number.isFinite(viewport) && viewport <= Math.max(1024, cutoff);
  const mobile = uaMobile || primaryCoarse || narrowTouch || boundedHybridTouch;
  return { mobile, coarse: primaryCoarse || (uaMobile && anyCoarse) };
}
