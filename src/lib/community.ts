import { demoForecast, eventSlots } from "./demo";
import { forecastIndex, integrateInterval } from "./impact";

export function simulateCommunity(minimumAttendees: number) {
  const forecast = demoForecast("delhi");
  const hours = forecastIndex(forecast);
  const durationMinutes = 30;
  const slots = eventSlots.map(slot => ({
    ...slot,
    eligible: slot.available >= minimumAttendees,
    proxy: slot.available >= minimumAttendees ? integrateInterval(hours, slot.startAt, durationMinutes)?.value ?? null : null,
  }));
  const ranked = slots.filter(slot => slot.eligible && slot.proxy !== null)
    .sort((a, b) => a.proxy! - b.proxy! || b.available - a.available || a.startAt.localeCompare(b.startAt));
  return {
    source: forecast.source, durationMinutes, slots, minimumAttendees, recommendedStart: ranked[0]?.startAt ?? null,
  };
}
