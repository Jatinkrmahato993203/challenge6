"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FlaskConical, ListChecks, MapPin, Plus, ShieldCheck, Wind } from "lucide-react";
import { cities, dateSchema, type Activity, type CityId, type ForecastSnapshot, type HouseholdPlan } from "@/lib/contracts";
import { atLocal, friendlyDate, localTime } from "@/lib/time";
import { ActivityEditor } from "./activity-editor";
import { ForecastChart } from "./forecast-chart";
import { ApiError, readJson, useWorkspace } from "./workspace-state";

type ForecastState = { key: string; snapshot: ForecastSnapshot | null; error: string; incomplete?: boolean };

export function Planner() {
  const { workspace, ready, pending, notice, compare, updatePlan, chooseMode, toggleSave, clear, restore } = useWorkspace();
  const { plan, mode } = workspace;
  const [attempt, setAttempt] = useState(0);
  const [forecast, setForecast] = useState<ForecastState | null>(null);
  const forecastKey = `${plan.cityId}:${mode}:${attempt}`;
  useEffect(() => {
    if (!ready) return;
    const abort = new AbortController();
    fetch(`/api/forecast?cityId=${plan.cityId}&mode=${mode}`, { signal: abort.signal })
      .then(readJson<ForecastSnapshot>)
      .then(snapshot => { if (!abort.signal.aborted) setForecast({ key: forecastKey, snapshot, error: "" }); })
      .catch(error => {
        if (!abort.signal.aborted) setForecast({ key: forecastKey, snapshot: null, error: error.message,
          incomplete: error instanceof ApiError && error.code === "INSUFFICIENT_DATA" });
      });
    return () => abort.abort();
  }, [ready, plan.cityId, mode, forecastKey]);

  const snapshot = forecast?.key === forecastKey ? forecast.snapshot : null;
  const forecastError = forecast?.key === forecastKey ? forecast.error : "";
  function changeDate(dateLocal: string) {
    if (!dateSchema.safeParse(dateLocal).success) return;
    const convert = (value: string) => atLocal(dateLocal, localTime(value));
    updatePlan({ ...plan, dateLocal, activities: plan.activities.map(activity => ({
      ...activity, startAt: convert(activity.startAt), candidateStarts: activity.candidateStarts.map(convert),
    })) });
  }
  function editActivity(activity: Activity) {
    updatePlan({ ...plan, activities: plan.activities.map(item => item.id === activity.id ? activity : item) });
  }
  function addActivity() {
    const starts = new Set(plan.activities.map(activity => localTime(activity.startAt)));
    const time = ["12:00", "13:00", "14:00", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30"].find(value => !starts.has(value)) ?? "12:00";
    const startAt = atLocal(plan.dateLocal, time);
    updatePlan({ ...plan, activities: [...plan.activities, {
      id: crypto.randomUUID(), label: "", environment: "outdoor", startAt, durationMinutes: 30, fixed: true, candidateStarts: [startAt],
    }] });
  }

  if (!ready) return <p className="shell app-intro" role="status">Opening the planner…</p>;
  return <div className="shell app-shell">
    <div className="app-intro split-intro">
      <div>
      <h1>Plan your day.</h1>
      <p>See the forecast, add your commitments and choose what can move.</p>
      </div>
      <p className="intro-location"><MapPin size={16} /> {cities[plan.cityId].name}</p>
    </div>
    <div className="planner-grid">
      <aside className="planner-side" aria-label="Forecast and settings">
        <fieldset className="card settings-card" disabled={pending}>
          <legend className="sr-only">Forecast settings</legend>
          <div className="section-header"><div className="heading-with-icon"><span className="icon-box"><MapPin size={20} /></span><div><h2>Location & date</h2><p>All times in India Standard Time</p></div></div></div>
          <div className="settings-fields">
            <label>City<select value={plan.cityId} onChange={event => updatePlan({ ...plan, cityId: event.target.value as CityId })}>
              {Object.entries(cities).map(([id, city]) => <option key={id} value={id}>{city.name}</option>)}
            </select></label>
            <label>Day<input type="date" value={plan.dateLocal} disabled={mode === "demo"} onChange={event => changeDate(event.target.value)} /></label>
          </div>
          <div className="mode-group" role="group" aria-label="Forecast data source">
            <button type="button" aria-pressed={mode === "live"} onClick={() => chooseMode("live")}><Wind size={16} /> Live forecast</button>
            <button type="button" aria-pressed={mode === "demo"} onClick={() => chooseMode("demo")}><FlaskConical size={16} /> Synthetic demo</button>
          </div>
        </fieldset>
        <ForecastChart snapshot={snapshot} date={plan.dateLocal} loading={forecast?.key !== forecastKey} error={forecastError}
          incomplete={forecast?.key === forecastKey && forecast.incomplete} retry={() => setAttempt(value => value + 1)} />
        {forecastError && mode === "live" && <button className="button button-outline wide" onClick={() => chooseMode("demo")} disabled={pending}><FlaskConical size={16} /> Use synthetic demo</button>}
        <section className="card local-card">
          <div className="heading-with-icon"><span className="icon-box"><ShieldCheck size={19} /></span><div><h2>On this device</h2><p>Browser storage is optional.</p></div></div>
          <label className="check"><input type="checkbox" checked={workspace.saved} onChange={event => toggleSave(event.target.checked)} disabled={pending} /> Save this routine on this device</label>
          <button type="button" className="quiet-button" onClick={clear} disabled={pending}>Delete saved routine</button>
        </section>
      </aside>
      <form className="planner-main" onSubmit={event => { event.preventDefault(); void compare(); }}>
        <fieldset className="card routine-card" disabled={pending}>
          <legend className="sr-only">Edit your routine</legend>
          <div className="section-header"><div className="heading-with-icon"><span className="icon-box"><ListChecks size={22} /></span><div><h2>Your activities</h2><p>{friendlyDate(plan.dateLocal)}</p></div></div><span className="count-label">{plan.activities.length} of 8 activities</span></div>
          <div className="activity-list">
            {plan.activities.map((activity, position) => <ActivityEditor key={activity.id} activity={activity} position={position} date={plan.dateLocal}
              change={editActivity} canRemove={plan.activities.length > 1} remove={() => updatePlan({ ...plan, activities: plan.activities.filter(item => item.id !== activity.id) })} />)}
          </div>
          <button type="button" className="button button-outline wide add-activity" onClick={addActivity} disabled={plan.activities.length >= 8}><Plus size={18} /> Add activity</button>
          <div className="compare-controls">
            <label>Rank options by<select value={plan.preference} onChange={event => updatePlan({ ...plan, preference: event.target.value as HouseholdPlan["preference"] })}>
              <option value="balanced">Balanced</option><option value="exposure-first">Largest modeled reduction</option><option value="least-disruption">Least disruption</option>
            </select></label>
            <button type="submit" className="button button-primary">{pending ? "Comparing…" : "Compare my day"} <ArrowRight size={18} /></button>
          </div>
          {workspace.restore && <button type="button" className="quiet-button" onClick={restore}>Restore original routine</button>}
          <p className="form-notice" role="status">{notice}</p>
        </fieldset>
        <p className="subtle planner-note">Regional forecasts cannot determine personal exposure. <Link href="/about">Read about the data</Link>.</p>
      </form>
    </div>
  </div>;
}
