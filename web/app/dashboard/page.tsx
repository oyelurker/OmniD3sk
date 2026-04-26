import type { Metadata } from "next";
import "./dashboard.css";
import DashboardClient from "../components/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard — OmniD3sk",
  description: "Manage your OmniD3sk integrations: Notion and Google Calendar.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
