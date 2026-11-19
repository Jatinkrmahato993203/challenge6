import { z } from "zod";
import { cities, forecastSchema, timezone, type CityId, type DataMode, type ForecastSnapshot } from "./contracts";
import { demoForecast } from "./demo";

export const openMeteoUrl = "https://air-quality-api.open-meteo.com/v1/air-quality";

const providerSchema = z.object({
  hourly_units: z.object({ pm2_5: z.enum(["μg/m³", "µg/m³", "ug/m3"]), time: z.literal("unixtime") }),
  hourly: z.object({
    time: z.array(z.number().int().min(0).max(4_200_000_000)).min(1).max(168),
    pm2_5: z.array(z.number().finite().nonnegative().nullable()),
  }),
}).refine(data => data.hourly.time.length === data.hourly.pm2_5.length);

export class ForecastError extends Error {
  constructor(readonly code: "FORECAST_UNAVAILABLE" | "INSUFFICIENT_DATA" | "DEMO_UNAVAILABLE", message: string) {
    super(message);
  }
}

export function normalizeOpenMeteo(raw: unknown, cityId: CityId, now = new Date()): ForecastSnapshot {
  const parsed = providerSchema.safeParse(raw);
  if (!parsed.success) throw new ForecastError("INSUFFICIENT_DATA", "The forecast provider returned incomplete or invalid data.");
  const { time, pm2_5 } = parsed.data.hourly;
  const normalized = forecastSchema.safeParse({
    cityId, timezone,
    source: {
      provider: "open-meteo", dataKind: "forecast", retrievedAt: now.toISOString(), issuedAt: null,
      spatialResolutionKm: 45, sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
      attribution: ["Open-Meteo", "Copernicus Atmosphere Monitoring Service (CAMS)"],
      model: "CAMS global atmospheric composition",
    },
    hours: time.map((epoch, index) => ({
      validAt: new Date(epoch * 1000).toISOString(), pm25UgM3: pm2_5[index],
    })).sort((a, b) => a.validAt.localeCompare(b.validAt)),
  });
  if (!normalized.success || time.some(epoch => epoch % 3600 !== 0)) {
    throw new ForecastError("INSUFFICIENT_DATA", "The forecast provider returned invalid hourly timestamps.");
  }
  return normalized.data;
}

export async function getForecast(cityId: CityId, mode: DataMode): Promise<ForecastSnapshot> {
  if (mode === "demo") {
    if (process.env.DEMO_DATA_MODE === "false") throw new ForecastError("DEMO_UNAVAILABLE", "Demo data is disabled.");
    return demoForecast(cityId);
  }
  if (process.env.LIVE_FORECAST_ENABLED === "false") {
    throw new ForecastError("FORECAST_UNAVAILABLE", "Live forecasts are unavailable in this environment.");
  }
  const { latitude, longitude } = cities[cityId];
  const url = new URL(openMeteoUrl);
  url.search = new URLSearchParams({
    latitude: String(latitude), longitude: String(longitude), hourly: "pm2_5",
    domains: "cams_global", timeformat: "unixtime", timezone: "GMT", forecast_days: "3",
  }).toString();
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error("Unexpected provider status");
  } catch {
    throw new ForecastError("FORECAST_UNAVAILABLE", "The regional forecast could not be loaded. Try again or choose the synthetic demo.");
  }
  let raw: unknown;
  try {
    raw = await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) throw new ForecastError("INSUFFICIENT_DATA", "The forecast provider returned unreadable data.");
    throw new ForecastError("FORECAST_UNAVAILABLE", "The regional forecast could not be read. Try again or choose the synthetic demo.");
  }
  return normalizeOpenMeteo(raw, cityId);
}
