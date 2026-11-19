import { type Activity, type CityId, type ForecastSnapshot, type HouseholdPlan, timezone } from "./contracts";
import { atLocal, hourMs } from "./time";

export const demoDate = "2026-12-01";
const profile = [
  158, 162, 167, 171, 176, 178, 182, 180, 142, 103, 86, 80, 71,
  67, 70, 74, 85, 102, 119, 131, 140, 145, 152, 156,
];

export function demoForecast(cityId: CityId): ForecastSnapshot {
  const start = Math.floor(Date.parse(atLocal(demoDate, "00:00")) / hourMs) * hourMs;
  return {
    cityId, timezone,
    source: {
      provider: "demo", dataKind: "demo", retrievedAt: new Date(start).toISOString(), issuedAt: null,
      spatialResolutionKm: null, sourceUrl: "/about", attribution: ["SaansAI synthetic fixture"], model: "Synthetic demonstration",
    },
    hours: Array.from({ length: 25 }, (_, index) => ({
      validAt: new Date(start + index * hourMs).toISOString(),
      pm25UgM3: profile[index % profile.length],
    })),
  };
}

export function samplePlan(cityId: CityId, dateLocal: string): HouseholdPlan {
  function activity(id: string, label: string, environment: Activity["environment"], time: string, durationMinutes: number, alternatives: string[] = []): Activity {
    const startAt = atLocal(dateLocal, time);
    return {
      id, label, environment, startAt, durationMinutes, fixed: !alternatives.length,
      candidateStarts: [startAt, ...alternatives.map(value => atLocal(dateLocal, value))],
    };
  }
  return {
    cityId, dateLocal, timezone, preference: "balanced",
    activities: [
      activity("walk", "Morning walk", "outdoor", "07:00", 30, ["11:00", "17:00"]),
      activity("school", "School drop-off", "travel", "08:00", 30),
      activity("work", "Work block", "indoor", "09:00", 90),
      activity("errands", "Afternoon errands", "travel", "15:30", 45),
    ],
  };
}

export const eventSlots = [
  { startAt: atLocal(demoDate, "08:00"), available: 7 },
  { startAt: atLocal(demoDate, "11:00"), available: 12 },
  { startAt: atLocal(demoDate, "14:00"), available: 8 },
  { startAt: atLocal(demoDate, "17:00"), available: 11 },
];
