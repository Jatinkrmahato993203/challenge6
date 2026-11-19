import type { Activity, ForecastSnapshot, ImpactMetric, Segment } from "./contracts";
import { hourMs, minuteMs } from "./time";

export function forecastIndex(forecast: ForecastSnapshot) {
  return new Map(forecast.hours.map(hour => [Date.parse(hour.validAt), hour.pm25UgM3]));
}

export function integrateInterval(hours: Map<number, number | null>, startAt: string, durationMinutes: number) {
  const start = Date.parse(startAt);
  const end = start + durationMinutes * minuteMs;
  const segments: Segment[] = [];
  let value = 0;
  let cursor = start;
  while (cursor < end) {
    const hour = Math.floor(cursor / hourMs) * hourMs;
    const concentration = hours.get(hour);
    if (concentration == null) return null;
    const stop = Math.min(end, hour + hourMs);
    const minutes = (stop - cursor) / minuteMs;
    segments.push({ validAt: new Date(hour).toISOString(), minutes, concentration });
    value += concentration * minutes / 60;
    cursor = stop;
  }
  return { value, segments };
}

export type EmissionFactor = {
  mode: NonNullable<Activity["mode"]>;
  kgPerPassengerKm: number;
  region: string;
  year: number;
  boundary: string;
  occupancy: string;
  source: string;
};

export function compareEmissions(baseline: Activity, alternative: Activity, factors: EmissionFactor[]): ImpactMetric {
  const find = (activity: Activity) => factors.find(factor =>
    factor.mode === activity.mode && Number.isFinite(factor.kgPerPassengerKm) &&
    factor.kgPerPassengerKm >= 0 && Number.isInteger(factor.year) && factor.year > 0 &&
    factor.region && factor.boundary && factor.occupancy && /^https:\/\//.test(factor.source));
  const a = find(baseline);
  const b = find(alternative);
  const akm = baseline.distanceKm;
  const bkm = alternative.distanceKm;
  const method = "Passenger distance × sourced kgCO₂e per passenger-km";
  if (!a || !b || a.region !== b.region || a.boundary !== b.boundary ||
    akm == null || bkm == null || !Number.isFinite(akm) || !Number.isFinite(bkm) || akm < 0 || bkm < 0) {
    return { metric: "transport-co2e", unit: "kgCO2e", baselineValue: null, candidateValue: null, deltaValue: null,
      percentLower: null, supported: false, method, assumptions: ["Compatible sourced factors and distances are required."] };
  }
  const baselineValue = akm * a.kgPerPassengerKm;
  const candidateValue = bkm * b.kgPerPassengerKm;
  const deltaValue = baselineValue - candidateValue;
  return { metric: "transport-co2e", unit: "kgCO2e", baselineValue, candidateValue, deltaValue,
    percentLower: baselineValue > 0 ? 100 * deltaValue / baselineValue : null, supported: true, method,
    assumptions: [`${a.region}, ${a.boundary}`, ...[a, b].map(factor =>
      `${factor.mode} · ${factor.year} · ${factor.occupancy} · ${factor.source}`)] };
}
