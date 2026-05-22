export function roundTo2(n: number) {
  if (!Number.isFinite(n)) {
    throw new TypeError("roundTo2: input must be a finite number");
  }
  const factor = 100; // 10 ** 2
  const rounded = Math.round(n * factor) / factor;
  return rounded;
}
