export function calculateUtilization(
  participants?: number | null,
  targetPlaces?: number | null,
): number | null {
  if (
    participants === null ||
    participants === undefined ||
    targetPlaces === null ||
    targetPlaces === undefined ||
    targetPlaces <= 0
  ) {
    return null;
  }
  return (participants / targetPlaces) * 100;
}

export function calculateFreePlaces(
  targetPlaces?: number | null,
  participants?: number | null,
): number | null {
  if (
    targetPlaces === null ||
    targetPlaces === undefined ||
    participants === null ||
    participants === undefined
  ) {
    return null;
  }
  return Math.max(0, targetPlaces - participants);
}

export function calculateCompletionRate(
  completions?: number | null,
  participants?: number | null,
): number | null {
  if (
    completions === null ||
    completions === undefined ||
    participants === null ||
    participants === undefined ||
    participants <= 0
  ) {
    return null;
  }
  return (completions / participants) * 100;
}

export function calculateTerminationRate(
  terminations?: number | null,
  participants?: number | null,
): number | null {
  if (
    terminations === null ||
    terminations === undefined ||
    participants === null ||
    participants === undefined ||
    participants <= 0
  ) {
    return null;
  }
  return (terminations / participants) * 100;
}

export function sumNullable(values: Array<number | null | undefined>): number | null {
  let total = 0;
  let hasValue = false;
  for (const value of values) {
    if (value !== null && value !== undefined) {
      total += value;
      hasValue = true;
    }
  }
  return hasValue ? total : null;
}

export function averageNullable(values: Array<number | null | undefined>): number | null {
  const filtered = values.filter((v): v is number => v !== null && v !== undefined);
  if (filtered.length === 0) {
    return null;
  }
  return filtered.reduce((acc, value) => acc + value, 0) / filtered.length;
}

export function linearRegressionTrend(values: number[]): number[] {
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) return [Math.round(values[0] * 10) / 10];

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  return values.map((_, i) => Math.round((slope * i + intercept) * 10) / 10);
}
