"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowLeft, ArrowRight, CalendarDays, Check, CircleHelp, FlaskConical, Leaf, LockKeyhole, Scale, Wind } from "lucide-react";
import type { Activity, CandidatePlan, OptimizeResult } from "@/lib/contracts";
import { fallbackExplanation, type Explanation } from "@/lib/explanation";
import { guidance, transportTip } from "@/lib/guidance";
import { friendlyDate, localDate, localTime } from "@/lib/time";
import { activityIcons } from "./activity-editor";
import { readJson, useWorkspace } from "./workspace-state";

const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const format = (value: number | null) => value === null ? "Unavailable" : number.format(value);

function Timeline({ title, activities, changed, isProposed }: {
  title: string; activities: Activity[]; changed: string[]; isProposed?: boolean;
}) {
  return <div className={`timeline ${isProposed ? "timeline-proposed" : ""}`}>
    <h3>{title}</h3>
    <ol>{[...activities].sort((a, b) => a.startAt.localeCompare(b.startAt)).map(activity => {
      const Icon = activityIcons[activity.environment];
      return <li key={activity.id} className={isProposed && changed.includes(activity.id) ? "moved" : ""}>
        <time dateTime={activity.startAt}>{localTime(activity.startAt)}</time><span className="icon-box"><Icon size={17} /></span>
        <div><strong>{activity.label}</strong><small>{activity.durationMinutes} min · {activity.environment}</small></div>
        {activity.fixed && <span className="fixed-note"><LockKeyhole size={13} /> Fixed</span>}
        {isProposed && changed.includes(activity.id) && <span className="moved-note">Moved</span>}
      </li>;
    })}</ol>
  </div>;
}

function Evidence({ candidate, result }: { candidate: CandidatePlan; result: OptimizeResult }) {
  const metric = candidate.metrics[0];
  return <details className="evidence card">
    <summary><CircleHelp size={21} /> How was this calculated?</summary>
    <div className="evidence-content">
      <p>Multiply each forecast concentration by the hours the activity overlaps that forecast interval, then add the results.</p>
      <div className="table-scroll"><table>
        <caption>Outdoor concentration-time inputs</caption>
        <thead><tr><th scope="col">Activity</th><th scope="col">Plan</th><th scope="col">Forecast hour (IST)</th><th scope="col">PM2.5 (µg/m³)</th><th scope="col">Minutes used</th></tr></thead>
        <tbody>{candidate.evidence.flatMap(item => (["original", "proposed"] as const).flatMap(key => item[key].map(segment =>
          <tr key={`${item.activityId}-${key}-${segment.validAt}`}>
            <td>{result.original.activities.find(activity => activity.id === item.activityId)?.label}</td>
            <td>{key === "original" ? "Original" : "Proposed"}</td><td>{localDate(new Date(segment.validAt))} {localTime(segment.validAt)}</td>
            <td>{format(segment.concentration)}</td><td>{segment.minutes}</td>
          </tr>)))}</tbody>
      </table></div>
      <p><strong>{format(metric.baselineValue)} → {format(metric.candidateValue)} µg·h/m³</strong> · Method {metric.method}</p>
      <ul>{metric.assumptions.map(assumption => <li key={assumption}>{assumption}</li>)}</ul>
      {result.source && <p>Source <a href={result.source.sourceUrl}>{result.source.attribution.join(" · ")}</a>{result.source.dataKind === "forecast" && <> · Retrieved <time dateTime={result.source.retrievedAt}>{localDate(new Date(result.source.retrievedAt))} at {localTime(result.source.retrievedAt)} IST</time></>}</p>}
    </div>
  </details>;
}

export function Compare() {
  const { workspace, ready, result, pending, compare, accept, reject, notice } = useWorkspace();
  const [option, setOption] = useState({ result: null as OptimizeResult | null, id: "" });
  const [explanation, setExplanation] = useState<{ token: string; value: Explanation } | null>(null);
  const token = result?.explanationToken;
  useEffect(() => {
    if (!token) return;
    const abort = new AbortController();
    fetch("/api/explain", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }), signal: abort.signal,
    }).then(readJson<Explanation>).then(value => {
      if (!abort.signal.aborted) setExplanation({ token, value });
    }).catch(() => {});
    return () => abort.abort();
  }, [token]);

  if (!ready || !result) return <div className="shell app-shell">
    <div className="app-intro"><h1>Decision Twin.</h1><p>Compare a routine to see its original schedule and any supported alternatives.</p></div>
    <Link href="/planner" className="button button-primary">Go to the planner <ArrowRight size={18} /></Link>
    <p className="form-notice" role="status">{notice}</p>
  </div>;

  const chosen = (option.result === result ? result.candidates.find(item => item.id === option.id) : undefined) ?? result.candidates[0];
  const demo = result.source?.dataKind === "demo" || workspace.mode === "demo";
  const why = explanation && explanation.token === token ? explanation.value : fallbackExplanation(result.status, demo);
  const metric = chosen?.metrics[0];
  const moved = chosen ? chosen.activities.filter(activity => chosen.changedActivityIds.includes(activity.id)) : [];
  function lock(activityId: string) {
    if (!result) return;
    void compare({ ...result.original, activities: result.original.activities.map(activity => activity.id === activityId
      ? { ...activity, fixed: true, candidateStarts: [activity.startAt] } : activity) });
  }
  return <div className="shell app-shell compare-shell">
    <Link className="text-link back-link" href="/planner"><ArrowLeft size={17} /> Back to planner</Link>
    <div className="app-intro split-intro">
      <div><h1>Decision Twin.</h1>
        <p><CalendarDays size={17} /> {friendlyDate(result.original.dateLocal)} in India Standard Time</p></div>
      {result.source && <span className={`pill ${demo ? "pill-demo" : "pill-neutral"}`}>{demo ? <FlaskConical size={15} /> : <Wind size={15} />}{demo ? "Synthetic demo" : "Regional forecast"}</span>}
    </div>
    {result.candidates.length > 1 && <div className="option-picker" role="group" aria-label="Schedule alternatives">{result.candidates.map((candidate, index) =>
      <button key={candidate.id} type="button" className="button button-small button-outline" aria-pressed={candidate.id === chosen?.id}
        onClick={() => setOption({ result, id: candidate.id })}>Option {index + 1}</button>)}</div>}
    {pending && <p className="form-notice" role="status">Recomputing options…</p>}
    {chosen && metric ? <section className="comparison-highlight" aria-label="Comparison summary">
      <div className="impact-copy"><p className="ledger-label"><ArrowDownRight size={17} /> Modeled outdoor indicator</p>
        <div key={chosen.id} className="impact-number comparison-in">{format(metric.percentLower)}<span>% lower</span></div>
        <p>{format(metric.baselineValue)} → {format(metric.candidateValue)} µg·h/m³</p>
        <small>Concentration-time indicator. It does not estimate inhaled dose or disease risk.</small>
      </div>
      <div className="changes"><h2>What changes</h2>{moved.map(activity => {
        const original = result.original.activities.find(item => item.id === activity.id)!;
        return <div className="change-row" key={activity.id}>
          <div><strong>{activity.label}</strong><span className="schedule-shift"><time dateTime={original.startAt}>{localTime(original.startAt)}</time><ArrowRight size={14} /><time className="proposed-time" dateTime={activity.startAt}>{localTime(activity.startAt)}</time> IST</span></div>
          <button className="button button-small button-outline" onClick={() => lock(activity.id)} disabled={pending}><LockKeyhole size={14} /> Lock {activity.label}</button>
        </div>;
      })}<p className="subtle">Lock an activity to keep its original time and compare again.</p></div>
    </section> : <section className="state-card card" role="status"><span className="icon-box"><CircleHelp size={23} /></span><div><h2>{why.headline}</h2><p>{why.whyThisPlan}</p></div></section>}
    {result.warnings.length > 0 && <ul className="result-warnings">{result.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>}
    <div className={`timelines ${chosen ? "" : "single-timeline"}`}>
      <Timeline title="Original day" activities={result.original.activities} changed={[]} />
      {chosen && <Timeline title="Proposed day" activities={chosen.activities} changed={chosen.changedActivityIds} isProposed />}
    </div>
    {chosen && <Evidence candidate={chosen} result={result} />}
    <div className="support-grid">
      <section className="card support-card"><span className="icon-box"><Scale size={20} /></span><h2>{chosen ? "Why this option?" : "What the comparison covers"}</h2>
        <p>{chosen ? why.whyThisPlan : why.cautions[0]}</p>
        {why.tradeoffs.map(item => <p key={item}>{item}</p>)}
        {chosen && <p className="subtle">{why.cautions[0]}</p>}
        <Link href="/indoor" className="text-link">{guidance.find(item => item.id === why.guidanceIds[0])?.title ?? "View indoor guidance"} <ArrowRight size={16} /></Link></section>
      <section className="card support-card"><span className="icon-box"><Leaf size={20} /></span><h2>{transportTip.title}</h2><p>{transportTip.summary}</p><p className="subtle">{transportTip.limitations}</p></section>
    </div>
    <div className="button-row compare-actions">
      {chosen && <button className="button button-primary" disabled={pending} onClick={() => accept(chosen.activities)}><Check size={18} /> Accept this alternative</button>}
      <button className="button button-outline" disabled={pending} onClick={reject}>Keep original routine</button>
    </div>
    <p className="form-notice" role="status">{notice}</p>
  </div>;
}
