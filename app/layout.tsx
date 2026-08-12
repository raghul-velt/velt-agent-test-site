import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechNova Solutions — Developer Infrastructure Platform Yes",
  description: "Build, deploy, and scale your applications with TechNova's intelligent developer infrastructure. Real-time analytics, seamless CI/CD, and enterprise-grade security.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
{/* <script id="superflowToolbarScript" data-sf-platform="figma-manual" async src="https://cdn.jsdelivr.net/npm/@usesuperflow/toolbar-staging/superflow.min.js?apiKey=rNYzMJd13L27xtfipmSK&projectId=faceea897e7a5e1cd19675e6ccf8890e"></script> */}
<Script
        id="superflowToolbarScript"
        src="https://cdn.jsdelivr.net/npm/@usesuperflow/toolbar-staging/superflow.min.js?apiKey=rNYzMJd13L27xtfipmSK&projectId=3141301152185640"
        data-sf-platform="other-manual"
        async
      />     
      <body>{children}</body>
    </html>
  );
}
