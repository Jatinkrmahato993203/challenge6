import { citySchema, modeSchema } from "@/lib/contracts";
import { ForecastError, getForecast } from "@/lib/forecast";
import { guard, json, problem } from "@/lib/http";

export async function GET(request: Request) {
  const limited = guard(request, "forecast");
  if (limited) return limited;
  const params = new URL(request.url).searchParams;
  const city = citySchema.safeParse(params.get("cityId"));
  const mode = modeSchema.safeParse(params.get("mode") ?? "live");
  if (!city.success) return problem("INVALID_CITY", "Choose a supported city.", 400);
  if (!mode.success) return problem("INVALID_MODE", "Choose live or demo data.", 400);
  try {
    return json(await getForecast(city.data, mode.data));
  } catch (error) {
    if (!(error instanceof ForecastError)) throw error;
    return problem(error.code, error.message, error.code === "INSUFFICIENT_DATA" ? 502 : 503);
  }
}
