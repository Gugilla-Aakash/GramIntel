"use client";

import { Suspense, lazy } from "react";
import { MotionConfig } from "framer-motion";
import { SmoothScroll } from "./system/SmoothScroll";
import { ProgressBar } from "./system/ProgressBar";
import { Nav } from "./system/Nav";
import { Cursor } from "./system/Cursor";
import { Hero } from "./hero/Hero";
import { ErrorBoundary } from "./system/ErrorFallback";

/* below-fold sections — dynamically imported for code splitting */
const ProblemIntelligence = lazy(() => import("./problem/ProblemIntelligence").then(m => ({ default: m.ProblemIntelligence })));
const HowItThinks = lazy(() => import("./thinking/HowItThinks").then(m => ({ default: m.HowItThinks })));
const MapStory = lazy(() => import("./map/MapStory").then(m => ({ default: m.MapStory })));
const MarketCloseup = lazy(() => import("./market-intelligence/MarketCloseup").then(m => ({ default: m.MarketCloseup })));
const ViabilityScore = lazy(() => import("./viability/ViabilityScore").then(m => ({ default: m.ViabilityScore })));
const AIReasoning = lazy(() => import("./intelligence-engine/AIReasoning").then(m => ({ default: m.AIReasoning })));
const FinancialStory = lazy(() => import("./financial-story/FinancialStory").then(m => ({ default: m.FinancialStory })));
const SchemeRouter = lazy(() => import("./scheme-router/SchemeRouter").then(m => ({ default: m.SchemeRouter })));
const RepaymentSim = lazy(() => import("./repayment/RepaymentSim").then(m => ({ default: m.RepaymentSim })));
const Multilingual = lazy(() => import("./multilingual/Multilingual").then(m => ({ default: m.Multilingual })));
const FinalCTA = lazy(() => import("./final-cta/FinalCTA").then(m => ({ default: m.FinalCTA })));
const Footer = lazy(() => import("./footer/Footer").then(m => ({ default: m.Footer })));
const RuralVideo = lazy(() => import("./rural-video/RuralVideo").then(m => ({ default: m.RuralVideo })));

function SectionFallback() {
  return <div style={{ minHeight: "60vh" }} aria-hidden />;
}

/**
 * One continuous story:
 * LOCATION → MARKET → SIGNALS → OPPORTUNITY → BUSINESS → FINANCE → DECISION
 */
export function Site() {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
      <div className="grain" style={{ background: "var(--warm)" }}>
        <Cursor />
        <ProgressBar />
        <Nav />
        <main id="main">
          <Hero />
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <ProblemIntelligence />
          </Suspense></ErrorBoundary>
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <HowItThinks />
          </Suspense></ErrorBoundary>
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <RuralVideo />
          </Suspense></ErrorBoundary>
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <MapStory />
          </Suspense></ErrorBoundary>
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <MarketCloseup />
          </Suspense></ErrorBoundary>
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <ViabilityScore />
          </Suspense></ErrorBoundary>
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <AIReasoning />
          </Suspense></ErrorBoundary>
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <FinancialStory />
          </Suspense></ErrorBoundary>
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <SchemeRouter />
          </Suspense></ErrorBoundary>
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <RepaymentSim />
          </Suspense></ErrorBoundary>
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <Multilingual />
          </Suspense></ErrorBoundary>
          <ErrorBoundary><Suspense fallback={<SectionFallback />}>
            <FinalCTA />
          </Suspense></ErrorBoundary>
        </main>
        <ErrorBoundary><Suspense fallback={<SectionFallback />}>
          <Footer />
        </Suspense></ErrorBoundary>
      </div>
      </SmoothScroll>
    </MotionConfig>
  );
}
