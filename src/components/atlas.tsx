"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CloudSun, Footprints, LockKeyhole, MapPin, Sun, Sunset } from "lucide-react";

const chapterLinks = [
  { id: "forecast", label: "Forecast" },
  { id: "decision-twin", label: "Decision Twin" },
  { id: "guide", label: "Guides" },
] as const;

export function AtlasChapters() {
  const [active, setActive] = useState<string>(chapterLinks[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const chapter = entries.find(entry => entry.isIntersecting);
      if (chapter) setActive(chapter.target.id);
    }, { rootMargin: "-22% 0px -55% 0px" });
    for (const { id } of chapterLinks) {
      const chapter = document.getElementById(id);
      if (chapter) observer.observe(chapter);
    }
    return () => observer.disconnect();
  }, []);

  return <nav className="atlas-chapters" aria-label="On this page">
    <div className="shell atlas-chapter-links">
      {chapterLinks.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>
        <span className="chapter-dot" aria-hidden="true" />{label}
      </a>)}
    </div>
  </nav>;
}

const momentIcons = { morning: CloudSun, midday: Sun, evening: Sunset };
export type SceneMoment = {
  key: keyof typeof momentIcons;
  label: string;
  time: string;
  pm25: number | null;
};

export function DayScene({ moments }: { moments: SceneMoment[] }) {
  const [index, setIndex] = useState(0);
  const current = moments[index];

  return <figure className="day-scene">
    <div className="scene-picture" data-moment={current.key}>
      <Image className="scene-art" src="/delhi-air-atlas.webp" alt="" fill preload sizes="(max-width: 720px) 100vw, 55vw" />
      <div className="scene-wash scene-wash-midday" aria-hidden="true" />
      <div className="scene-wash scene-wash-evening" aria-hidden="true" />
      <span className="scene-place"><MapPin size={16} /> New Delhi</span>
      <div className="scene-reading" role="status">
        <span>{current.time} IST</span>
        <strong>{current.pm25 ?? "Unavailable"}{current.pm25 !== null && <small> µg/m³</small>}</strong>
        <span>Synthetic PM2.5 forecast</span>
      </div>
    </div>
    <div className="scene-times" role="group" aria-label="Sample forecast times">
      {moments.map(({ key, label, time }, choice) => {
        const Icon = momentIcons[key];
        return <button key={key} type="button" aria-pressed={index === choice} onClick={() => setIndex(choice)}>
          <Icon size={20} /><span><strong>{label}</strong><time>{time}</time></span>
        </button>;
      })}
    </div>
    <figcaption>Illustrated scene with synthetic forecast values.</figcaption>
  </figure>;
}

export type ComparisonFrame = {
  id: "original" | "proposed";
  label: string;
  walkTime: string;
  schoolTime: string;
  value: number;
};

export function DecisionPreview({ frames }: { frames: ComparisonFrame[] }) {
  const [index, setIndex] = useState(0);
  const frame = frames[index];

  return <div className="decision-preview" data-frame={frame.id}>
    <div className="decision-select" role="group" aria-label="Sample schedule">
      {frames.map(({ id, label }, choice) =>
        <button key={id} type="button" aria-pressed={index === choice} onClick={() => setIndex(choice)}>{label}</button>
      )}
    </div>
    <div className="decision-frame" role="status">
      <div className="decision-measure">
        <span>Modeled outdoor indicator</span>
        <strong key={frame.id} className="decision-value">{frame.value}<small> µg·h/m³</small></strong>
      </div>
      <dl className="decision-rows">
        <div><dt><Footprints size={18} /> Morning walk</dt><dd><time className={frame.id === "proposed" ? "proposed-time" : undefined}>{frame.walkTime}</time></dd></div>
        <div><dt><LockKeyhole size={17} /> School drop-off</dt><dd><time>{frame.schoolTime}</time></dd></div>
      </dl>
    </div>
  </div>;
}
