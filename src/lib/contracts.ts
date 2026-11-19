import { z } from "zod";

export const cities = {
  delhi: { name: "New Delhi", region: "Delhi, India", latitude: 28.6139, longitude: 77.209 },
  mumbai: { name: "Mumbai", region: "Maharashtra, India", latitude: 19.076, longitude: 72.8777 },
  bengaluru: { name: "Bengaluru", region: "Karnataka, India", latitude: 12.9716, longitude: 77.5946 },
} as const;

export const timezone = "Asia/Kolkata";
export const citySchema = z.enum(["delhi", "mumbai", "bengaluru"]);
export const modeSchema = z.enum(["live", "demo"]);
export const preferenceSchema = z.enum(["balanced", "exposure-first", "least-disruption"]);
export const dateSchema = z.iso.date();
export const timeSchema = z.iso.time({ precision: -1 });
export const instantSchema = z.iso.datetime({ offset: true }).transform(value => new Date(value).toISOString());
export const environmentSchema = z.enum(["outdoor", "indoor", "travel"]);
const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,48}$/);

export const activitySchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1).max(80),
  environment: environmentSchema,
  startAt: instantSchema,
  durationMinutes: z.number().int().min(15).max(240).multipleOf(15),
  fixed: z.boolean(),
  candidateStarts: z.array(instantSchema).min(1).max(12),
  travelBufferMinutes: z.number().int().min(0).max(120).optional(),
  mode: z.enum(["car", "bus", "metro", "walk", "cycle"]).optional(),
  distanceKm: z.number().finite().min(0).max(2000).optional(),
});

export const planSchema = z.strictObject({
  cityId: citySchema,
  dateLocal: dateSchema,
  timezone: z.literal(timezone),
  preference: preferenceSchema,
  activities: z.array(activitySchema).min(1).max(8),
});

export const sourceSchema = z.strictObject({
  provider: z.enum(["open-meteo", "demo"]),
  dataKind: z.enum(["forecast", "observation", "demo"]),
  retrievedAt: instantSchema,
  issuedAt: instantSchema.nullable(),
  spatialResolutionKm: z.number().positive().nullable(),
  sourceUrl: z.string(),
  attribution: z.array(z.string()),
  model: z.string(),
});

export const hourSchema = z.strictObject({
  validAt: instantSchema,
  pm25UgM3: z.number().finite().nonnegative().nullable(),
});

export const forecastSchema = z.strictObject({
  cityId: citySchema,
  timezone: z.literal(timezone),
  source: sourceSchema,
  hours: z.array(hourSchema).min(1).max(168),
}).refine(snapshot => snapshot.hours.every((hour, index) =>
  index === 0 || hour.validAt > snapshot.hours[index - 1].validAt), "Forecast hours must be unique and ordered");

export const optimizeRequestSchema = z.strictObject({ plan: planSchema, mode: modeSchema });
export const statuses = ["ALTERNATIVES_FOUND", "NO_BETTER_OPTION", "INSUFFICIENT_DATA", "INVALID_SCHEDULE", "FORECAST_UNAVAILABLE"] as const;

export type CityId = z.infer<typeof citySchema>;
export type DataMode = z.infer<typeof modeSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type HouseholdPlan = z.infer<typeof planSchema>;
export type SourceMeta = z.infer<typeof sourceSchema>;
export type ForecastSnapshot = z.infer<typeof forecastSchema>;
export type PlanStatus = typeof statuses[number];

export type Segment = { validAt: string; minutes: number; concentration: number };
export type ActivityEvidence = {
  activityId: string;
  original: Segment[];
  proposed: Segment[];
};
export type ImpactMetric = {
  metric: "outdoor-concentration-time" | "transport-co2e";
  unit: "ug-h/m3" | "kgCO2e";
  baselineValue: number | null;
  candidateValue: number | null;
  deltaValue: number | null;
  percentLower: number | null;
  supported: boolean;
  method: string;
  assumptions: string[];
};
export type CandidatePlan = {
  id: string;
  activities: Activity[];
  changedActivityIds: string[];
  metrics: ImpactMetric[];
  evidence: ActivityEvidence[];
  shiftMinutes: number;
};
export type OptimizeResult = {
  status: PlanStatus;
  source: SourceMeta | null;
  original: HouseholdPlan;
  candidates: CandidatePlan[];
  warnings: string[];
  explanationToken?: string;
};
