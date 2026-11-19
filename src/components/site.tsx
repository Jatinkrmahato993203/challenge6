"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Wind } from "lucide-react";

const pages = [
  { href: "/", label: "Overview" },
  { href: "/planner", label: "Day planner" },
  { href: "/indoor", label: "Indoor guide" },
  { href: "/community", label: "Community" },
];

export function Brand() {
  return <Link href="/" className="brand" aria-label="SaansAI home">
    <span className="brand-mark"><Wind size={20} strokeWidth={2.3} /></span><span>Saans<span className="brand-ai">AI</span></span>
  </Link>;
}

export function Header() {
  const path = usePathname();
  return <header className="site-header">
    <div className="shell header-inner">
      <Brand />
      <nav aria-label="Main navigation">
        {pages.map(({ href, label }) => <Link key={href} href={href} aria-current={path === href || (href === "/planner" && path === "/compare") ? "page" : undefined}>{label}</Link>)}
      </nav>
      <Link href="/planner" className="button button-small button-outline header-cta">Open planner <ArrowRight size={15} /></Link>
    </div>
  </header>;
}

export function Footer() {
  return <footer className="site-footer">
    <div className="shell footer-inner"><Brand /><span>Air-quality planning for everyday decisions.</span><Link href="/about">Sources & privacy <ArrowRight size={15} /></Link></div>
  </footer>;
}
