import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, House, UsersRound } from "lucide-react";
import { AtlasChapters, DayScene, DecisionPreview, type ComparisonFrame, type SceneMoment } from "@/components/atlas";
import { ForecastExplorer } from "@/components/forecast-chart";
import type { Activity } from "@/lib/contracts";
import { demoDate, demoForecast, samplePlan } from "@/lib/demo";
import { optimize } from "@/lib/optimizer";
import { atLocal, localTime } from "@/lib/time";

const sceneTimes = [
  { key: "morning", label: "Morning", time: "07:00" },
  { key: "midday", label: "Midday", time: "11:00" },
  { key: "evening", label: "Evening", time: "17:00" },
] as const;

const guides = [
  { href: "/indoor", icon: House, title: "Inside your home", detail: "See how source control, filtration, and ventilation help indoors." },
  { href: "/community", icon: UsersRound, title: "Plan a community event", detail: "Try comparing sample event times against a minimum attendance." },
  { href: "/about", icon: BookOpen, title: "Sources and privacy", detail: "See where the forecasts come from and what happens to your routine." },
];

function comparisonFrame(id: ComparisonFrame["id"], activities: Activity[], value: number | null): ComparisonFrame | null {
  const walk = activities.find(activity => activity.id === "walk");
  const school = activities.find(activity => activity.id === "school");
  if (!walk || !school || value === null) return null;
  return {
    id, label: id === "original" ? "Original plan" : "Proposed plan",
    walkTime: localTime(walk.startAt), schoolTime: localTime(school.startAt), value,
  };
}

export default function Home() {
  const forecast = demoForecast("delhi");
  const moments: SceneMoment[] = sceneTimes.map(moment => ({
    ...moment,
    pm25: forecast.hours.findLast(hour => hour.validAt <= atLocal(demoDate, moment.time))?.pm25UgM3 ?? null,
  }));
  const plan = samplePlan("delhi", demoDate);
  const candidate = optimize(plan, forecast).candidates[0];
  const metric = candidate?.metrics[0];
  const original = metric && comparisonFrame("original", plan.activities, metric.baselineValue);
  const proposed = metric && comparisonFrame("proposed", candidate.activities, metric.candidateValue);

  return <div className="atlas-home">
    <section className="atlas-hero" aria-labelledby="home-title">
      <div className="shell atlas-spread">
        <div className="atlas-copy">
          <h1 id="home-title">Plan around<br /><span>the air.</span></h1>
          <p>Use regional air-quality forecasts to move flexible activities and keep fixed plans in place.</p>
          <div className="button-row">
            <Link href="/planner" className="button atlas-primary">Plan my day <ArrowRight size={18} /></Link>
            <Link href="/planner?mode=demo" className="button atlas-secondary">Try a sample day</Link>
          </div>
          <a href="#forecast" className="atlas-scroll"><ArrowDown size={18} /> Explore the sample forecast</a>
        </div>
        <DayScene moments={moments} />
      </div>
    </section>

    <AtlasChapters />

    <section id="forecast" className="shell atlas-chapter atlas-forecast" aria-labelledby="forecast-chapter-title">
      <div className="chapter-heading">
        <span className="chapter-label">01 / Forecast</span>
        <h2 id="forecast-chapter-title">The air changes by the hour.</h2>
        <p>Drag through a synthetic day in New Delhi. The planner uses regional forecasts, so each value describes conditions at the model’s scale.</p>
      </div>
      <div className="atlas-plot">
        <div className="atlas-panel-heading"><h3>New Delhi forecast</h3><span className="pill pill-demo">Synthetic demo</span></div>
        <ForecastExplorer hours={forecast.hours} defaultIndex={7} />
      </div>
    </section>

    <section id="decision-twin" className="atlas-chapter atlas-twin" aria-labelledby="twin-chapter-title">
      <div className="shell atlas-twin-grid">
        <div className="chapter-heading">
          <span className="chapter-label">02 / Decision Twin</span>
          <h2 id="twin-chapter-title">Move the walk.<br />Keep school drop-off.</h2>
          <p>Switch between the original and proposed plans. The sample compares outdoor concentration over the same walk duration, using a synthetic forecast.</p>
          <Link href="/planner?mode=demo" className="text-link">Open the sample in the planner <ArrowRight size={17} /></Link>
        </div>
        {original && proposed && <DecisionPreview frames={[original, proposed]} />}
      </div>
    </section>

    <section id="guide" className="shell atlas-chapter atlas-guides" aria-labelledby="guide-chapter-title">
      <div className="chapter-heading">
        <span className="chapter-label">03 / Guides</span>
        <h2 id="guide-chapter-title">Plan indoors and together.</h2>
      </div>
      <ul className="atlas-guide-list">{guides.map(({ href, icon: Icon, title, detail }) =>
        <li key={href}><Link href={href}><Icon size={21} /><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={20} /></Link></li>
      )}</ul>
    </section>
  </div>;
}
