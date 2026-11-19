import Link from "next/link";
import { ArrowDownRight, ArrowRight, CalendarClock, ChevronRight, CloudSun, Footprints, LockKeyhole, MapPin, Play, ShieldCheck, Wind } from "lucide-react";
import { Trend } from "@/components/forecast-chart";
import { demoForecast } from "@/lib/demo";

const steps = [
  { icon: CloudSun, title: "See how the air changes", text: "Check the regional PM2.5 forecast by hour, with its source and limitations in view." },
  { icon: CalendarClock, title: "Keep what needs to stay", text: "Add your commitments, lock fixed activities and choose the times you can work with." },
  { icon: ArrowDownRight, title: "Compare your options", text: "See what could move, how the modeled indicator changes and what trade-offs come with it." },
];

export default function Home() {
  return <div className="shell home">
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="status-dot" /> AIR-QUALITY DAY PLANNER</div>
        <h1>Plan your day<br />around <em>the air.</em></h1>
        <p>See when air pollution is forecast to be lower, find a better time for flexible plans, and keep the commitments that can’t move.</p>
        <div className="button-row">
          <Link href="/planner" className="button button-primary">Plan my day <ArrowRight size={18} /></Link>
          <Link href="/planner?mode=demo" className="button button-outline"><Play size={15} /> Try a sample day</Link>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-rings" aria-hidden="true" />
        <div className="visual-top"><span><span className="visual-dot" /> DECISION TWIN</span><span className="visual-location"><MapPin size={14} /> NEW DELHI</span></div>
        <div className="hero-preview">
          <div className="preview-chart">
            <div className="preview-heading"><div><span className="preview-kicker">THROUGH THE DAY</span><h2>PM2.5 forecast</h2></div><span className="preview-demo">Sample data</span></div>
            <Trend values={demoForecast("delhi").hours.map(hour => hour.pm25UgM3)} decorative />
            <div className="chart-labels" aria-hidden="true"><span>Prev. 23:30</span><span>05:30</span><span>11:30</span><span>17:30</span><span>23:30</span></div>
          </div>
          <div className="preview-rows">
            <div className="preview-row"><span className="preview-icon"><Footprints size={18} /></span><div><strong>Morning walk</strong><span>Flexible activity</span></div><div className="preview-time"><s>07:00</s><ArrowRight size={13} /><strong>11:00</strong></div></div>
            <div className="preview-row"><span className="preview-icon muted"><LockKeyhole size={16} /></span><div><strong>School drop-off</strong><span>Fixed commitment</span></div><div className="preview-time"><strong>08:00</strong></div></div>
          </div>
        </div>
        <div className="visual-bottom"><Wind size={17} /> Synthetic values · Illustrative schedule</div>
      </div>
    </section>
    <div className="trust-band">
      <div><CloudSun size={21} /><span><strong>Regional forecasts</strong><small>Source and time included</small></span></div>
      <div><LockKeyhole size={20} /><span><strong>Fixed activities stay put</strong><small>You decide what can move</small></span></div>
      <div><ShieldCheck size={21} /><span><strong>No account needed</strong><small>Save to this browser if you choose</small></span></div>
    </div>
    <section className="how-section">
      <p className="eyebrow">HOW IT WORKS</p>
      <h2>From a forecast to a plan.</h2>
      <div className="step-grid">{steps.map(({ icon: Icon, title, text }) => <div className="card step-card" key={title}><span className="icon-box"><Icon size={21} /></span><h3>{title}</h3><p>{text}</p></div>)}</div>
      <Link href="/about" className="text-link">See how we use air-quality data <ChevronRight size={17} /></Link>
    </section>
  </div>;
}
