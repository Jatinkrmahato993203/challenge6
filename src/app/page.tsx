import Link from "next/link";
import { ArrowRight, Footprints, LockKeyhole, MapPin, Play } from "lucide-react";
import { Trend } from "@/components/forecast-chart";
import { demoForecast } from "@/lib/demo";

const steps = [
  { title: "Read the forecast", text: "Check the hours you’re considering and see where the regional forecast comes from." },
  { title: "Set your commitments", text: "Add appointments and errands. Lock the ones that must stay and specify when flexible activities can move." },
  { title: "Compare the trade-offs", text: "Look at the original and proposed schedules side by side. Open the evidence before deciding which plan to keep." },
];

export default function Home() {
  return <div className="shell home">
    <section className="hero">
      <div className="hero-copy">
        <h1>Plan your day<br />around the air.</h1>
        <p>Use the regional PM2.5 forecast to find a different time for flexible activities and keep fixed commitments in place.</p>
        <div className="button-row">
          <Link href="/planner" className="button button-primary">Plan my day <ArrowRight size={18} /></Link>
          <Link href="/planner?mode=demo" className="button button-outline"><Play size={15} /> Try a sample day</Link>
        </div>
      </div>
      <div className="hero-visual">
        <div className="preview-chart">
          <div className="visual-top"><span><MapPin size={15} /> New Delhi</span><span className="preview-demo">Synthetic demo</span></div>
          <div className="preview-heading"><h2>PM2.5 through the day</h2><span>µg/m³</span></div>
          <Trend values={demoForecast("delhi").hours.map(hour => hour.pm25UgM3)} marks={[7.5, 11.5]} />
          <div className="chart-labels" aria-hidden="true"><span>Prev. 23:30</span><span>05:30</span><span>11:30</span><span>17:30</span><span>23:30</span></div>
        </div>
        <div className="preview-rows">
          <div className="preview-row"><Footprints size={18} /><strong>Morning walk</strong><div className="preview-time"><time>07:00</time><ArrowRight size={14} /><time className="proposed-time">11:00</time></div></div>
          <div className="preview-row"><LockKeyhole size={17} /><strong>School drop-off</strong><div className="preview-time"><span>Fixed</span><time>08:00</time></div></div>
        </div>
      </div>
    </section>
    <section className="how-section">
      <div className="how-intro"><h2>From a forecast to a plan.</h2><Link href="/about" className="text-link">See the sources and limitations</Link></div>
      <ol className="method-list">{steps.map(({ title, text }) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol>
    </section>
  </div>;
}
