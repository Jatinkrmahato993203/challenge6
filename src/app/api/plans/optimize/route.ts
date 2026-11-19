import { signExplanation } from "@/lib/ai";
import { optimizeRequestSchema, type OptimizeResult } from "@/lib/contracts";
import { ForecastError, getForecast } from "@/lib/forecast";
import { body, guard, json, problem } from "@/lib/http";
import { complexityLimit, optimize, validateSchedule } from "@/lib/optimizer";

export async function POST(request: Request) {
  const limited = guard(request, "optimize");
  if (limited) return limited;
  const parsed = await body(request, optimizeRequestSchema);
  if ("response" in parsed) return parsed.response;
  const { plan, mode } = parsed.value;
  const scheduleError = validateSchedule(plan);
  if (scheduleError) return problem("INVALID_SCHEDULE", scheduleError, 422);
  if (plan.activities.reduce((count, activity) => count * activity.candidateStarts.length, 1) > complexityLimit) {
    return problem("COMPLEXITY_LIMIT", "There are more than 2,000 possible combinations. Remove some permitted start times.", 422);
  }
  let result: OptimizeResult;
  try {
    result = optimize(plan, await getForecast(plan.cityId, mode));
  } catch (error) {
    if (!(error instanceof ForecastError)) throw error;
    result = { original: plan, status: error.code === "INSUFFICIENT_DATA" ? "INSUFFICIENT_DATA" : "FORECAST_UNAVAILABLE",
      source: null, candidates: [], warnings: [error.message] };
  }
  return json({ ...result, explanationToken: signExplanation(result) }, result.status === "FORECAST_UNAVAILABLE" ? 503 : 200);
}
