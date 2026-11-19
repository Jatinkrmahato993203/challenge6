import { describe, expect, it } from "vitest";
import { demoDate, demoForecast, samplePlan } from "@/lib/demo";
import { compareEmissions, forecastIndex, integrateInterval, type EmissionFactor } from "@/lib/impact";
import { optimize, validateSchedule } from "@/lib/optimizer";
import { atLocal } from "@/lib/time";

const fixture = () => ({ plan: samplePlan("delhi", demoDate), forecast: demoForecast("delhi") });
const at = (time: string) => atLocal(demoDate, time);

describe("decision twin", () => {
  it("matches the golden fixture and preserves locked and unchanged commitments", () => {
    const { plan, forecast } = fixture();
    const result = optimize(plan, forecast);
    expect(result.status).toBe("ALTERNATIVES_FOUND");
    expect(result.candidates).toHaveLength(1);
    const [option] = result.candidates;
    expect(option.changedActivityIds).toEqual(["walk"]);
    expect(option.activities[0]).toMatchObject({ startAt: at("11:00"), durationMinutes: 30 });
    expect(option.activities.slice(1)).toEqual(plan.activities.slice(1));
    expect(option.metrics[0]).toMatchObject({ baselineValue: 90, candidateValue: 40, deltaValue: 50, supported: true });
    expect(option.metrics[0].percentLower).toBeCloseTo(55.56, 2);
    expect(option.evidence[0].original).toEqual([{ validAt: at("06:30"), minutes: 30, concentration: 180 }]);
  });

  it("honors a user lock and abstains when no movable outdoor activity remains", () => {
    const { plan, forecast } = fixture();
    const walk = plan.activities[0];
    plan.activities[0] = { ...walk, fixed: true, candidateStarts: [walk.startAt] };
    expect(optimize(plan, forecast)).toMatchObject({ status: "NO_BETTER_OPTION", original: plan, candidates: [] });
  });

  it("rejects fixed overlaps and invalid times or fixed alternatives", () => {
    const { plan, forecast } = fixture();
    const school = plan.activities[1];
    plan.activities[1] = { ...school, startAt: at("07:15"), candidateStarts: [at("07:15")] };
    expect(optimize(plan, forecast).status).toBe("INVALID_SCHEDULE");
    plan.activities[1] = { ...school, candidateStarts: [school.startAt, at("11:00")] };
    expect(validateSchedule(plan)).toMatch(/fixed activities/);
    plan.activities[1] = { ...school, startAt: at("23:45"), candidateStarts: [at("23:45")] };
    expect(validateSchedule(plan)).toMatch(/fit within/);
  });

  it("excludes candidates that overlap a buffer and only ranks permitted starts", () => {
    const { plan, forecast } = fixture();
    const work = plan.activities[2];
    plan.activities[2] = { ...work, travelBufferMinutes: 60 };
    const result = optimize(plan, forecast);
    expect(result.status).toBe("ALTERNATIVES_FOUND");
    expect(result.candidates.map(item => item.activities[0].startAt)).toEqual([at("17:00")]);
    expect(result.candidates.every(candidate => candidate.activities.every((item, i) =>
      plan.activities[i].candidateStarts.includes(item.startAt)))).toBe(true);
  });

  it("enforces the cap for combinations before enumeration", () => {
    const { plan, forecast } = fixture();
    const choices = Array.from({ length: 12 }, (_, i) => at(`${String(6 + i).padStart(2, "0")}:00`));
    plan.activities = plan.activities.map((item, i) => ({
      ...item, startAt: choices[i * 2], fixed: false, candidateStarts: choices,
    }));
    expect(optimize(plan, forecast)).toMatchObject({ status: "INVALID_SCHEDULE", complexityExceeded: true });
  });

  it("distinguishes missing coverage from no better option with equal or zero concentrations", () => {
    const { plan, forecast } = fixture();
    const unknown = { ...forecast, hours: forecast.hours.map(hour => ({ ...hour, pm25UgM3: null })) };
    expect(optimize(plan, unknown).status).toBe("INSUFFICIENT_DATA");
    expect(optimize(plan, { ...forecast, hours: forecast.hours.slice(12) }).status).toBe("INSUFFICIENT_DATA");
    for (const value of [65, 0]) {
      const flat = { ...forecast, hours: forecast.hours.map(hour => ({ ...hour, pm25UgM3: value })) };
      expect(optimize(plan, flat)).toMatchObject({ status: "NO_BETTER_OPTION", candidates: [] });
    }
  });

  it("keeps indoor and travel activity out of the outdoor metric", () => {
    const { plan, forecast } = fixture();
    plan.activities[0].environment = "indoor";
    expect(optimize(plan, forecast)).toMatchObject({ status: "NO_BETTER_OPTION", candidates: [] });
  });

  it("orders non-dominated choices by preference", () => {
    const { plan, forecast } = fixture();
    const walk = plan.activities[0];
    walk.candidateStarts = [at("07:00"), at("11:00"), at("14:00")];
    expect(optimize({ ...plan, preference: "exposure-first" }, forecast).candidates[0].activities[0].startAt).toBe(at("14:00"));
    expect(optimize({ ...plan, preference: "least-disruption" }, forecast).candidates[0].activities[0].startAt).toBe(at("11:00"));
  });
});

describe("impact arithmetic", () => {
  it("integrates partial hours and treats zero as data", () => {
    const { forecast } = fixture();
    const hours = forecastIndex(forecast);
    expect(integrateInterval(hours, at("06:15"), 30)?.value).toBe((182 + 180) / 4);
    hours.set(Date.parse(at("06:30")), 0);
    expect(integrateInterval(hours, at("07:00"), 30)?.value).toBe(0);
    hours.delete(Date.parse(at("06:30")));
    expect(integrateInterval(hours, at("06:15"), 30)).toBeNull();
  });

  it("withholds emissions unless comparable sourced factors and distances exist", () => {
    const { plan } = fixture();
    const trip = { ...plan.activities[1], mode: "car" as const, distanceKm: 10 };
    const alternative = { ...trip, distanceKm: 8 };
    const factor: EmissionFactor = { mode: "car", kgPerPassengerKm: .2, region: "Test region", year: 2025,
      boundary: "operational", occupancy: "1 passenger", source: "https://example.test/test-fixture" };
    expect(compareEmissions(trip, alternative, [])).toMatchObject({ supported: false, baselineValue: null });
    expect(compareEmissions(trip, { ...alternative, distanceKm: -1 }, [factor]).supported).toBe(false);
    expect(compareEmissions(trip, alternative, [{ ...factor, kgPerPassengerKm: -1 }]).supported).toBe(false);
    expect(compareEmissions(trip, alternative, [factor])).toMatchObject({ supported: true, baselineValue: 2, candidateValue: 1.6 });
  });
});
