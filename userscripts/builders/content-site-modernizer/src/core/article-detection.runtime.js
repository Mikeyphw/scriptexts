function csmArticleDecision({ hintMatched = false, evidenceScore = 0, evidenceCount = 0, evidenceMin = 2 } = {}) {
  if (Boolean(hintMatched)) return true;
  const count = Math.max(0, Number(evidenceCount) || 0);
  if (!count) return false;
  const threshold = Math.max(1, Number(evidenceMin) || 2);
  return Math.max(0, Number(evidenceScore) || 0) >= threshold;
}
