import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniD3sk — AI Helpdesk & Productivity Orchestrator",
  description:
    "OmniD3sk is a multi-agent AI helpdesk platform powered by Gemini Live, OmniShield, and the OmniFlow orchestration engine.",
  keywords: ["helpdesk", "AI assistant", "OmniD3sk", "Gemini", "support"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
