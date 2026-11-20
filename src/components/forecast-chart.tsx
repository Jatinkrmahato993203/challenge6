"use client";

import { useId, useState } from "react";
import { ChartNoAxesCombined, Clock3, Info } from "lucide-react";
import type { ForecastSnapshot } from "@/lib/contracts";
import { hourMs, localDate, localTime } from "@/lib/time";

type Point = { x: number; y: number } | null;

function Trend({ values, mark }: { values: (number | null)[]; mark: number }) {
  const fillId = useId();
  const largest = Math.max(1, ...values.map(value => value ?? 0));
  const step = Math.max(25, Math.ceil(largest / 100) * 25);
  const ceiling = step * 4;
  const dx = 392 / Math.max(1, values.length - 1);
  const xAt = (index: number) => 4 + index * dx;
  const points: Point[] = values.map((value, index) => value === null ? null : ({
    x: xAt(index),
    y: 99 - value / ceiling * 89,
  }));
  const groups: NonNullable<Point>[][] = [];
  let current: NonNullable<Point>[] = [];
  for (const point of [...points, null]) {
    if (point) current.push(point);
    else if (current.length) {
      groups.push(current);
      current = [];
    }
  }
  return <svg viewBox="0 0 400 105" preserveAspectRatio="none" className="trend" aria-hidden="true">
    <defs><linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--chart-line)" stopOpacity=".22" /><stop offset="100%" stopColor="var(--chart-line)" stopOpacity=".03" /></linearGradient></defs>
    {[10, 32.25, 54.5, 76.75, 99].map(y => <path key={y} d={`M0 ${y}H400`} stroke="var(--chart-grid)" vectorEffect="non-scaling-stroke" />)}
    {groups.map((group, index) => {
      const end = Math.min(396, group.at(-1)!.x + dx);
      const line = group.map((p, i) => i ? `H${p.x}V${p.y}` : `M${p.x},${p.y}`).join(" ") + `H${end}`;
      return <g key={index}>
        <path d={`${line} L${end},99 L${group[0].x},99Z`} fill={`url(#${fillId})`} />
        {end === group[0].x
          ? <circle cx={end} cy={group[0].y} r="2" fill="var(--chart-line)" />
          : <path d={line} fill="none" stroke="var(--chart-line)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
      </g>;
    })}
    {points[mark] && <g className="chart-mark">
      <path d={`M${xAt(mark)},${points[mark].y}V99`} stroke="currentColor" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
      <path d={`M${xAt(mark) - 2},${points[mark].y}h4`} stroke="currentColor" strokeWidth="6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </g>}
  </svg>;
}

type ForecastHour = ForecastSnapshot["hours"][number];

export function ForecastExplorer({ hours, defaultIndex = 0 }: { hours: ForecastHour[]; defaultIndex?: number }) {
  const [index, setIndex] = useState(defaultIndex);
  const selectedIndex = Math.max(0, Math.min(index, hours.length - 1));
  const selected = hours[selectedIndex];
  if (!selected) return null;
  const time = localTime(selected.validAt);
  const date = localDate(new Date(selected.validAt));
  const currentDay = localDate(new Date(hours[hours.length - 1].validAt));
  const concentration = selected.pm25UgM3;
  const ticks = [0, 1, 2, 3, 4].map(part => Math.round(part * (hours.length - 1) / 4));

  return <div className="forecast-explorer">
    <div className="explorer-reading">
      <time dateTime={selected.validAt}>{date !== currentDay && "Previous day, "}{time} IST</time>
      <strong>{concentration ?? "Unavailable"}{concentration !== null && <small> µg/m³</small>}</strong>
    </div>
    <Trend values={hours.map(hour => hour.pm25UgM3)} mark={selectedIndex} />
    <div className="chart-labels" aria-hidden="true">{[...new Set(ticks)].map(i => <span key={i}>{i === 0 && localDate(new Date(hours[i].validAt)) !== currentDay && "Prev. "}{localTime(hours[i].validAt)}</span>)}</div>
    <label className="forecast-scrubber">
      Forecast hour
      <input type="range" min={0} max={hours.length - 1} step={1} value={selectedIndex}
        aria-valuetext={`${date} at ${time} IST. ${concentration === null ? "Forecast unavailable" : `${concentration} micrograms per cubic metre`}`}
        onChange={event => setIndex(event.currentTarget.valueAsNumber)} />
    </label>
  </div>;
}

export function ForecastChart({ snapshot, date, loading, error, incomplete, retry }: {
  snapshot: ForecastSnapshot | null; date: string; loading: boolean; error: string; incomplete?: boolean; retry: () => void;
}) {
  const byTime = new Map(snapshot?.hours.map(hour => [Date.parse(hour.validAt), hour]));
  const start = Math.floor(Date.parse(`${date}T00:00:00+05:30`) / hourMs) * hourMs;
  const hours = snapshot ? Array.from({ length: 25 }, (_, i) => {
    const time = start + i * hourMs;
    return byTime.get(time) ?? { validAt: new Date(time).toISOString(), pm25UgM3: null };
  }) : [];
  const values = hours.map(hour => hour.pm25UgM3);
  const available = values.filter((value): value is number => value !== null);
  return <section className="card forecast-card" aria-labelledby="forecast-title">
    <div className="section-header">
      <div className="heading-with-icon"><span className="icon-box"><ChartNoAxesCombined size={20} /></span><div><h2 id="forecast-title">PM2.5 forecast</h2><p>Hourly particulate concentration · µg/m³</p></div></div>
      {snapshot && <span className={`pill ${snapshot.source.dataKind === "demo" ? "pill-demo" : "pill-neutral"}`}>{snapshot.source.dataKind === "demo" ? "Synthetic demo" : "Regional forecast"}</span>}
    </div>
    {loading && <div className="loading-panel" role="status"><span>Loading forecast…</span><div className="skeleton-chart" aria-hidden="true" /></div>}
    {!loading && error && <div className="chart-empty status-error"><Info size={22} /><div role="status"><strong>{incomplete ? "Incomplete forecast data" : "Forecast unavailable"}</strong><p>{error}</p></div><button className="button button-small button-outline" onClick={retry}>Retry forecast</button></div>}
    {!loading && !error && snapshot && <>
      {available.length > 0 ? <>
        <div className="chart-summary"><strong>{Math.min(...available)}–{Math.max(...available)}</strong> <span>µg/m³ across available hours</span></div>
        <ForecastExplorer key={`${snapshot.cityId}:${date}:${snapshot.source.dataKind}`} hours={hours} defaultIndex={values.findIndex(value => value !== null)} />
      </> : <div className="chart-empty"><p role="status">No hourly forecast values for this date. Choose another date or retry.</p><button className="button button-small button-outline" onClick={retry}>Retry forecast</button></div>}
      <div className="forecast-source"><Clock3 size={15} /><span>{snapshot.source.dataKind === "demo"
        ? "Synthetic demonstration values are not real pollution readings."
        : <>Retrieved {localDate(new Date(snapshot.source.retrievedAt))} at {localTime(snapshot.source.retrievedAt)} IST · Issue time {snapshot.source.issuedAt ? localTime(snapshot.source.issuedAt) + " IST" : "not supplied"} · Approx. 45 km model grid</>}</span></div>
      <p className="subtle">{snapshot.source.attribution.join(" · ")}{snapshot.source.dataKind !== "demo" && " · Regional forecast, not a street-level or personal measurement."}</p>
      <details className="hourly-table">
        <summary>View hourly values and timestamps</summary>
        <div className="table-scroll"><table><caption>Forecast hour starts in India Standard Time</caption><thead><tr><th scope="col">Date and time (IST)</th><th scope="col">PM2.5 (µg/m³)</th></tr></thead>
          <tbody>{hours.map(hour => <tr key={hour.validAt}><td>{localDate(new Date(hour.validAt))} {localTime(hour.validAt)}</td><td>{hour.pm25UgM3 ?? "Unavailable"}</td></tr>)}</tbody></table></div>
      </details>
    </>}
  </section>;
}
