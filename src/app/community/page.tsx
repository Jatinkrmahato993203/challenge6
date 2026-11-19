import type { Metadata } from "next";
import { CommunityDemo } from "@/components/community-demo";

export const metadata: Metadata = { title: "Community demo" };
export default function CommunityPage() { return <CommunityDemo />; }
