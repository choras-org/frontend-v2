export function getAbsorptionColor(absorptionValue: number): number {
  const value = Math.max(0, Math.min(1, absorptionValue));

  let r: number, g: number, b: number;

  if (value < 0.5) {
    // Dark Blue (0.0) -> Dark Purple (0.5)
    const t = value * 2;
    r = Math.round(0 + (100 - 0) * t);
    g = Math.round(50 + (0 - 50) * t);
    b = Math.round(150 + (100 - 150) * t);
  } else {
    // Dark Purple (0.5) -> Dark Red (1.0)
    const t = (value - 0.5) * 2;
    r = Math.round(100 + (180 - 100) * t);
    g = Math.round(0 + (0 - 0) * t);
    b = Math.round(100 + (50 - 100) * t);
  }

  return (r << 16) | (g << 8) | b;
}

export function calculateAverageAbsorption(coefficients: number[]): number {
  if (coefficients.length === 0) return 0;
  const sum = coefficients.reduce((acc, val) => acc + val, 0);
  return sum / coefficients.length;
}
