export function calcXpGain(isCorrect, isReview) {
  if (!isCorrect) return 0;
  return isReview ? 5 : 10;
}

export function calcLevel(exp) {
  return Math.floor(exp / 100) + 1;
}
