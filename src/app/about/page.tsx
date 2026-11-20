import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "Sources and privacy" };
const sources = [
  ["Open-Meteo Air Quality", "https://open-meteo.com/en/docs/air-quality-api"],
  ["Copernicus Atmosphere Monitoring Service", "https://atmosphere.copernicus.eu/"],
  ["Central Pollution Control Board, India", "https://app.cpcbccr.com/AQIIndia"],
  ["EPA guide to air cleaners in the home", "https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home"],
];

export default function AboutPage() {
  return <div className="shell app-shell reading-shell">
    <div className="app-intro"><h1>Sources and privacy.</h1><p>What goes into a comparison and where your information goes.</p></div>
    <div className="reading-grid">
    <div className="reading-copy">
    <section className="reading-card"><h2>Forecasts and estimates</h2>
      <p>Live forecasts use Open-Meteo and the CAMS global atmospheric composition model. The model grid is approximately 45 km. A regional forecast is not a street-level or personal measurement.</p>
      <p>PM2.5 concentration is reported in µg/m³. The Decision Twin multiplies concentration by time in comparable outdoor intervals. A smaller modeled concentration-time indicator does not estimate inhaled dose, indoor PM2.5, disease risk, or whether a time is safe.</p>
      <p>Demonstration values are synthetic and marked throughout the app. For current restrictions and health guidance, follow applicable official notices.</p>
    </section>
    <section className="reading-card"><h2>Your routine stays under your control</h2>
      <p>SaansAI uses manual city selection and does not ask for accounts, GPS, health details, or individual community schedules. City coordinates go to the forecast provider. Your routine goes to SaansAI’s server for computation and is not retained by the application.</p>
      <p>If you enable Save this routine, your current routine, restore point, and data mode are stored in this browser. Use Delete saved routine in the planner to remove them. Browser storage is accessible to other people using the same browser profile.</p>
      <p>When optional AI explanations are enabled, Gemini receives only the result state and a synthetic-or-forecast flag. It selects from approved phrases and guidance IDs. It receives no activity names, addresses, or full schedules.</p>
    </section>
    </div>
    <aside className="card sources-panel" aria-label="References">
      <h2>References</h2>
      <ul className="source-list">{sources.map(([title, href]) => <li key={href}><a className="text-link" href={href}>{title} <ExternalLink size={15} /></a></li>)}</ul>
    </aside>
    </div>
  </div>;
}
