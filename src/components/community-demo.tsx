"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, Clock3, FlaskConical } from "lucide-react";
import type { simulateCommunity } from "@/lib/community";
import { localTime } from "@/lib/time";
import { readJson } from "./workspace-state";

type Simulation = ReturnType<typeof simulateCommunity>;

export function CommunityDemo() {
  const [draft, setDraft] = useState("10");
  const [request, setRequest] = useState({ minimumAttendees: 10 });
  const [response, setResponse] = useState<{ request: typeof request; result: Simulation | null; error: string } | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/community/simulate", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal: abort.signal,
    }).then(readJson<Simulation>).then(result => {
      if (!abort.signal.aborted) setResponse({ request, result, error: "" });
    }).catch(error => {
      if (!abort.signal.aborted) setResponse({ request, result: null, error: error.message });
    });
    return () => abort.abort();
  }, [request]);
  const loading = response?.request !== request;
  const result = loading ? null : response?.result;
  const recommend = result?.recommendedStart;
  return <div className="shell app-shell">
    <div className="app-intro split-intro">
      <div><h1>Find a time together.</h1><p>Explore a sample event using aggregate attendance and a synthetic forecast.</p></div>
      <span className="pill pill-demo"><FlaskConical size={15} /> Synthetic scenario</span>
    </div>
    <div className="community-grid">
      <form className="card community-settings" onSubmit={event => { event.preventDefault(); setRequest({ minimumAttendees: Number(draft) }); }}>
        <div className="heading-with-icon"><span className="icon-box"><CalendarClock size={21} /></span><div><h2>Courtyard meet-up</h2><p>A 30-minute event in New Delhi</p></div></div>
        <p>Set a minimum attendance. Eligible times are then compared using the modeled outdoor concentration-time indicator.</p>
        <label>Minimum attendees<input type="number" min={1} max={20} value={draft} onChange={event => setDraft(event.target.value)} required /></label>
        <button className="button button-primary wide" type="submit">Compare event times <ArrowRight size={17} /></button>
      </form>
      <section className="card community-results">
        <div className="heading-with-icon"><span className="icon-box"><Clock3 size={21} /></span><div><h2>Event windows</h2><p>Synthetic availability counts</p></div></div>
        {loading && <div className="loading-panel" role="status"><p>Comparing event times…</p><div className="skeleton-rows" aria-hidden="true" /></div>}
        {!loading && response?.error && <p className="form-notice" role="status">{response.error}</p>}
        {result && <>
          <p className="community-summary" role="status">{recommend
            ? <>Lowest modeled value among eligible slots at <strong>{localTime(recommend)} IST</strong>.</>
            : "No event time meets the attendance threshold."}</p>
          <table className="slot-list">
            <caption className="sr-only">Modeled outdoor indicator and attendance by time</caption>
            <thead><tr><th scope="col">Time (IST)</th><th scope="col">Available</th><th scope="col">Modeled value</th></tr></thead>
            <tbody>{result.slots.map(slot => <tr className={slot.startAt === recommend ? "recommended-slot" : undefined} key={slot.startAt}>
              <th scope="row"><time dateTime={slot.startAt}>{localTime(slot.startAt)}</time></th><td>{slot.available}</td>
              <td>{slot.proxy !== null ? `${slot.proxy} µg·h/m³` : "Below minimum"}</td>
            </tr>)}</tbody>
          </table>
        </>}
        <p className="subtle">Availability and pollution values are fictional. A lower modeled value does not establish safe conditions.</p>
      </section>
    </div>
  </div>;
}
