import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/instrument-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "GramIntel — Turn Local Opportunity Into a Sustainable Business",
  description:
    "Hyper-local enterprise intelligence for rural India. GramIntel reads your village's market signals — consumers, competition, demand — and turns them into a business decision you can defend.",
  keywords: [
    "rural entrepreneurship",
    "market intelligence",
    "India",
    "village business",
    "loan planning",
    "Smart India Hackathon",
  ],
};

export const viewport: Viewport = {
  themeColor: "#071A14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://tiles.openfreemap.org" />
        <link rel="preconnect" href="https://basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://overpass-api.de" />
        <link rel="preconnect" href="https://overpass.kumi.systems" />
        <link rel="preconnect" href="https://images.pexels.com" />
        <link rel="preconnect" href="https://videos.pexels.com" />
      </head>
      <body>
        <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
