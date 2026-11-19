import { timezone } from "./contracts";

const dateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const longDateFormat = new Intl.DateTimeFormat("en-IN", { timeZone: timezone, weekday: "long", month: "long", day: "numeric" });

export const hourMs = 60 * 60 * 1000;
export const minuteMs = 60 * 1000;
export const localDate = (time: number | Date = new Date()) => dateFormat.format(time);
export const localTime = (instant: string) => timeFormat.format(new Date(instant));
export const friendlyDate = (date: string) => longDateFormat.format(new Date(`${date}T12:00:00+05:30`));

// Every supported city uses India Standard Time, with no daylight-saving offset.
export const atLocal = (date: string, time: string) => new Date(`${date}T${time}:00+05:30`).toISOString();
export const addMinutes = (instant: string, minutes: number) => new Date(Date.parse(instant) + minutes * minuteMs).toISOString();
