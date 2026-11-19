import type { PlanStatus } from "./contracts";

export type Explanation = {
  headline: string;
  whyThisPlan: string;
  tradeoffs: string[];
  cautions: string[];
  guidanceIds: string[];
  provider: "model" | "fallback";
};

const copy: Record<PlanStatus, [string, string]> = {
  ALTERNATIVES_FOUND: ["A permitted time has a lower modeled value", "The comparison preserves locked activities and uses only times you permitted."],
  NO_BETTER_OPTION: ["Keep your original plan", "No meaningfully better supported option was found among the times you permitted."],
  INSUFFICIENT_DATA: ["The forecast cannot support a comparison", "Some required intervals lack usable data. No reduction can be calculated from those intervals."],
  INVALID_SCHEDULE: ["Review your scheduled activities", "Check for overlaps, buffers, and permitted times before comparing again."],
  FORECAST_UNAVAILABLE: ["The regional forecast is unavailable", "Retry the forecast or explicitly choose the synthetic demo."],
};

export function fallbackExplanation(status: PlanStatus, demo: boolean): Explanation {
  return {
    headline: copy[status][0], whyThisPlan: copy[status][1],
    tradeoffs: status === "ALTERNATIVES_FOUND" ? ["Check whether the time shift is practical for your household."] : [],
    cautions: [
      demo ? "Synthetic demonstration values are not real pollution readings."
        : "Regional forecast, not a street-level or personal measurement.",
      "The modeled comparison does not estimate inhaled dose or disease risk.",
    ],
    guidanceIds: ["IA-01", "IA-02"], provider: "fallback",
  };
}
