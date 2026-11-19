import type { Activity, CandidatePlan, ForecastSnapshot, HouseholdPlan, OptimizeResult } from "./contracts";
import { forecastIndex, integrateInterval } from "./impact";
import { hourMs, localDate, minuteMs } from "./time";

export const complexityLimit = 2000;
export const compareMethod = "saansai-piecewise-hourly-v1";
const minAbsolute = 10;
const minRelative = 20;
const epsilon = 1e-8;

type Slot = { start: number; end: number };
const slot = (activity: Activity, start: number): Slot => ({
  start, end: start + (activity.durationMinutes + (activity.travelBufferMinutes ?? 0)) * minuteMs,
});
const collides = (a: Slot, b: Slot) => a.start < b.end && b.start < a.end;

export function validateSchedule(plan: HouseholdPlan) {
  const seen = new Set<string>();
  const occupied: { activity: Activity; interval: Slot }[] = [];
  for (const activity of plan.activities) {
    const starts = activity.candidateStarts;
    if (seen.has(activity.id)) return "Every activity needs a unique identifier.";
    seen.add(activity.id);
    if (new Set(starts).size !== starts.length || !starts.includes(activity.startAt) || (activity.fixed && starts.length !== 1)) {
      return `Check the permitted times for “${activity.label}”. The original start must appear exactly once, and fixed activities allow only that start.`;
    }
    for (const choice of starts) {
      const interval = slot(activity, Date.parse(choice));
      if (!Number.isFinite(interval.start) || localDate(interval.start) !== plan.dateLocal || localDate(interval.end - 1) !== plan.dateLocal) {
        return `“${activity.label}” and its buffer must fit within the selected day.`;
      }
    }
    const interval = slot(activity, Date.parse(activity.startAt));
    const overlap = occupied.find(item => collides(item.interval, interval));
    if (overlap) return `“${overlap.activity.label}” and “${activity.label}” overlap, including any buffers.`;
    occupied.push({ activity, interval });
  }
  return null;
}

function alternatives(plan: HouseholdPlan) {
  const result: Activity[][] = [];
  const selected: Activity[] = [];
  const intervals: Slot[] = [];
  function visit(index: number, changed: boolean) {
    if (index === plan.activities.length) {
      if (changed) result.push([...selected]);
      return;
    }
    const activity = plan.activities[index];
    for (const startAt of [...activity.candidateStarts].sort()) {
      const interval = slot(activity, Date.parse(startAt));
      if (intervals.some(other => collides(other, interval))) continue;
      selected.push({ ...activity, startAt });
      intervals.push(interval);
      visit(index + 1, changed || startAt !== activity.startAt);
      intervals.pop();
      selected.pop();
    }
  }
  visit(0, false);
  return result;
}

const reduction = (candidate: CandidatePlan) => candidate.metrics[0].deltaValue ?? 0;
const disruption = (candidate: CandidatePlan) => candidate.changedActivityIds.length;
function dominates(a: CandidatePlan, b: CandidatePlan) {
  return reduction(a) >= reduction(b) - epsilon && disruption(a) <= disruption(b) && a.shiftMinutes <= b.shiftMinutes &&
    (reduction(a) > reduction(b) + epsilon || disruption(a) < disruption(b) || a.shiftMinutes < b.shiftMinutes);
}

export function optimize(plan: HouseholdPlan, forecast: ForecastSnapshot): OptimizeResult & { complexityExceeded?: boolean } {
  const base = { original: plan, source: forecast.source, candidates: [], warnings: [] };
  const error = validateSchedule(plan);
  if (error) return { ...base, status: "INVALID_SCHEDULE", warnings: [error] };
  if (plan.activities.reduce((count, activity) => count * activity.candidateStarts.length, 1) > complexityLimit) {
    return { ...base, status: "INVALID_SCHEDULE", complexityExceeded: true,
      warnings: ["There are more than 2,000 possible combinations. Remove some permitted start times and try again."] };
  }
  const first = Date.parse(forecast.hours[0].validAt);
  const end = Date.parse(forecast.hours.at(-1)!.validAt) + hourMs;
  const fresh = !forecast.source.issuedAt || Date.now() - Date.parse(forecast.source.issuedAt) <= 24 * hourMs;
  const withinForecast = (activity: Activity) => Date.parse(activity.startAt) >= first &&
    Date.parse(activity.startAt) + activity.durationMinutes * minuteMs <= end;
  if (forecast.cityId !== plan.cityId || !fresh || !plan.activities.every(withinForecast)) {
    return { ...base, status: "INSUFFICIENT_DATA", warnings: ["The forecast is missing, stale, or does not cover the original schedule for this city and day."] };
  }

  const hours = forecastIndex(forecast);
  // Compare the same group of movable outdoor activities across every ranked option.
  const outdoor = plan.activities.filter(activity => activity.environment === "outdoor" && !activity.fixed && activity.candidateStarts.length > 1);
  const original = new Map(outdoor.map(activity => [activity.id, integrateInterval(hours, activity.startAt, activity.durationMinutes)]));
  const cohort = outdoor.filter(activity => original.get(activity.id));
  const baseline = cohort.reduce((sum, activity) => sum + original.get(activity.id)!.value, 0);
  let unsupported = false;
  let comparable = false;
  const qualifying: CandidatePlan[] = [];
  for (const proposal of alternatives(plan)) {
    const changes = proposal.filter((activity, index) => activity.startAt !== plan.activities[index].startAt);
    if (!changes.some(activity => activity.environment === "outdoor")) continue;
    if (!proposal.every(withinForecast) || changes.some(activity => activity.environment === "outdoor" && !original.get(activity.id))) {
      unsupported = true;
      continue;
    }
    const proposed = new Map(cohort.map(activity => {
      const next = proposal.find(item => item.id === activity.id)!;
      return [activity.id, integrateInterval(hours, next.startAt, next.durationMinutes)] as const;
    }));
    if ([...proposed.values()].some(value => value === null)) {
      unsupported = true;
      continue;
    }
    comparable = true;
    const candidateValue = [...proposed.values()].reduce((sum, entry) => sum + entry!.value, 0);
    const deltaValue = baseline - candidateValue;
    const percentLower = baseline > 0 ? 100 * deltaValue / baseline : null;
    if (deltaValue + epsilon < minAbsolute || percentLower === null || percentLower + epsilon < minRelative) continue;
    qualifying.push({
      id: `option-${qualifying.length + 1}`, activities: proposal, changedActivityIds: changes.map(activity => activity.id),
      shiftMinutes: proposal.reduce((sum, activity, i) =>
        sum + Math.abs(Date.parse(activity.startAt) - Date.parse(plan.activities[i].startAt)) / minuteMs, 0),
      metrics: [{
        metric: "outdoor-concentration-time", unit: "ug-h/m3", baselineValue: baseline, candidateValue, deltaValue,
        percentLower, supported: true, method: compareMethod,
        assumptions: [
          "Equal activity duration and outdoor context.",
          "Each forecast value is held constant across its UTC hour; only overlapping minutes contribute.",
          "The threshold is a demonstration heuristic. Model uncertainty is not quantified.",
        ],
      }],
      evidence: cohort.map(activity => ({
        activityId: activity.id, original: original.get(activity.id)!.segments, proposed: proposed.get(activity.id)!.segments,
      })),
    });
  }
  const warnings = unsupported ? ["Some permitted options could not be compared because forecast coverage is incomplete."] : [];
  if (!qualifying.length) {
    return { ...base, status: unsupported && !comparable ? "INSUFFICIENT_DATA" : "NO_BETTER_OPTION", warnings };
  }
  const byReduction = (a: CandidatePlan, b: CandidatePlan) => reduction(b) - reduction(a);
  const byChanges = (a: CandidatePlan, b: CandidatePlan) => disruption(a) - disruption(b);
  const byShift = (a: CandidatePlan, b: CandidatePlan) => a.shiftMinutes - b.shiftMinutes;
  const candidates = qualifying.filter(a => !qualifying.some(b => dominates(b, a))).sort((a, b) => {
    const order = plan.preference === "least-disruption" ? byChanges(a, b) || byShift(a, b) || byReduction(a, b)
      : plan.preference === "exposure-first" ? byReduction(a, b) || byShift(a, b) || byChanges(a, b)
      : byChanges(a, b) || byReduction(a, b) || byShift(a, b);
    return order || Number(a.id.slice(7)) - Number(b.id.slice(7));
  }).slice(0, 3);
  return { ...base, status: "ALTERNATIVES_FOUND", candidates, warnings };
}
