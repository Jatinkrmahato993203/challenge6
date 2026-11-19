import type { Metadata } from "next";
import { Footer, Header } from "@/components/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SaansAI — Plan around the air", template: "%s | SaansAI" },
  description: "Compare practical changes to your day using regional air-quality forecasts and the activities you need to keep.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en">
    <body>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer />
    </body>
  </html>;
}
