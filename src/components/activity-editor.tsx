"use client";

import { Bike, Clock3, Footprints, House, LockKeyhole, LockKeyholeOpen, Plus, Trash2, X } from "lucide-react";
import { timeSchema, type Activity } from "@/lib/contracts";
import { atLocal, localTime } from "@/lib/time";

export const activityIcons = { travel: Bike, outdoor: Footprints, indoor: House };

export function ActivityEditor({ activity, date, position, change, remove, canRemove }: {
  activity: Activity; date: string; position: number; change: (activity: Activity) => void;
  remove: () => void; canRemove: boolean;
}) {
  const Icon = activityIcons[activity.environment];
  const alternate = activity.candidateStarts.filter(start => start !== activity.startAt);
  function newTime(value: string) {
    if (!timeSchema.safeParse(value).success) return;
    const startAt = atLocal(date, value);
    change({ ...activity, startAt, candidateStarts: [startAt, ...alternate.filter(start => start !== startAt)] });
  }
  function setAlternative(index: number, value: string) {
    if (!timeSchema.safeParse(value).success) return;
    const updated = [...alternate];
    updated[index] = atLocal(date, value);
    change({ ...activity, candidateStarts: [activity.startAt, ...updated] });
  }
  function addAlternative() {
    const used = new Set(activity.candidateStarts);
    for (let hour = 6; hour < 23; hour++) {
      for (const minute of [0, 30]) {
        const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        const start = atLocal(date, time);
        if (!used.has(start)) {
          change({ ...activity, candidateStarts: [...activity.candidateStarts, start] });
          return;
        }
      }
    }
  }
  const activityName = activity.label || `Activity ${position + 1}`;
  return <div className="activity-card">
    <div className="activity-head">
      <span className={`icon-box activity-icon ${activity.environment}`}><Icon size={19} /></span>
      <label className="activity-name"><span className="sr-only">Activity {position + 1} name</span><input value={activity.label} onChange={event => change({ ...activity, label: event.target.value })} placeholder="Name this activity" required maxLength={80} /></label>
      <button type="button" className={`lock-button ${activity.fixed ? "is-fixed" : ""}`} aria-pressed={activity.fixed} aria-label={`${activity.fixed ? "Fixed" : "Flexible"} activity: ${activityName}`} onClick={() => change({ ...activity, fixed: !activity.fixed, candidateStarts: [activity.startAt] })}>
        {activity.fixed ? <LockKeyhole size={14} /> : <LockKeyholeOpen size={14} />} <span>{activity.fixed ? "Fixed" : "Flexible"}</span>
      </button>
      <button type="button" className="icon-button remove" aria-label={`Remove ${activityName}`} onClick={remove} disabled={!canRemove}><Trash2 size={16} /></button>
    </div>
    <div className="activity-fields">
      <label>Environment<select value={activity.environment} onChange={event => change({ ...activity, environment: event.target.value as Activity["environment"] })}>
        <option value="outdoor">Outdoor</option><option value="indoor">Indoor</option><option value="travel">Travel</option>
      </select></label>
      <label>Start time<input type="time" value={localTime(activity.startAt)} onChange={event => newTime(event.target.value)} required /></label>
      <label>Duration<select value={activity.durationMinutes} onChange={event => change({ ...activity, durationMinutes: Number(event.target.value) })}>
        {Array.from({ length: 16 }, (_, i) => (i + 1) * 15).map(value => <option key={value} value={value}>{value} min</option>)}
      </select></label>
      <label>Buffer after<select value={activity.travelBufferMinutes ?? 0} onChange={event => change({ ...activity, travelBufferMinutes: Number(event.target.value) })}>
        {[0, 5, 10, 15, 20, 30, 45, 60, 90, 120].map(value => <option key={value} value={value}>{value ? `${value} min` : "None"}</option>)}
      </select></label>
    </div>
    {!activity.fixed && <div className="permitted"><span className="field-title"><Clock3 size={15} /> Other permitted starts</span>
      <div className="permitted-times">
        {alternate.map((start, index) => <div className="time-option" key={index}>
          <input type="time" aria-label={`${activityName} permitted start ${index + 1}`} value={localTime(start)} onChange={event => setAlternative(index, event.target.value)} />
          <button type="button" className="icon-button" aria-label={`Remove permitted start ${index + 1} for ${activityName}`} onClick={() => change({ ...activity, candidateStarts: [activity.startAt, ...alternate.filter((_, i) => i !== index)] })}><X size={14} /></button>
        </div>)}
        {alternate.length < 11 && <button type="button" className="button button-small button-outline" onClick={addAlternative}><Plus size={15} /> Add a time</button>}
      </div>
    </div>}
  </div>;
}
