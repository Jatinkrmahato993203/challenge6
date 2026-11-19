import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, Fan, House, Leaf, ShieldAlert, Wind } from "lucide-react";
import { guidance } from "@/lib/guidance";

export const metadata: Metadata = { title: "Indoor guide" };
const icons = { source: House, filter: Fan, window: Wind, ozone: ShieldAlert, cost: Leaf };

export default function IndoorPage() {
  return <div className="shell app-shell">
    <div className="app-intro"><p className="eyebrow"><House size={17} /> INDOOR GUIDE</p><h1>Inside your home.</h1>
      <p>Practical ways to reduce indoor particle sources and use filtration.</p></div>
    <div className="info-strip"><Wind size={22} /><p><strong>Indoor conditions are unknown.</strong> Indoor PM2.5 was not measured. These recommendations are qualitative.</p></div>
    <div className="guidance-grid">
      {guidance.map(item => {
        const Icon = icons[item.icon];
        return <article key={item.id} className="card guidance-card">
          <div className="guidance-top"><span className="icon-box"><Icon size={22} /></span><span className="pill pill-neutral">{item.evidence}</span></div>
          <h2>{item.title}</h2><p>{item.summary}</p><p className="subtle">{item.limitations}</p>
          <a href={item.evidenceUrl} className="text-link">EPA guidance <ExternalLink size={15} /></a>
        </article>;
      })}
    </div>
    <Link href="/planner" className="text-link page-bottom-link">Go to the day planner <ArrowRight size={17} /></Link>
  </div>;
}
