import type { Metadata } from "next";
import { Compare } from "@/components/compare";

export const metadata: Metadata = { title: "Decision Twin" };
export default function ComparePage() { return <Compare />; }
