"use client";

/**
 * Central icon registry — Lucide React only, one visual weight.
 * Usage: <Icon.MapPin /> etc. Never mix other icon families.
 */
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  ChartNoAxesCombined,
  IndianRupee,
  Landmark,
  Languages,
  MapPin,
  Route,
  ShieldAlert,
  Store,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Info,
  Radar,
  ScanLine,
  Target,
  CircleCheck,
  FlaskConical,
  Database,
  Play,
  Volume2,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

const base = (P: LucideProps): LucideProps => ({
  strokeWidth: 1.75,
  size: 18,
  ...P,
});

export const Icon = {
  ArrowRight: (p: LucideProps) => <ArrowRight {...base(p)} />,
  ArrowUpRight: (p: LucideProps) => <ArrowUpRight {...base(p)} />,
  Calculator: (p: LucideProps) => <Calculator {...base(p)} />,
  Chart: (p: LucideProps) => <ChartNoAxesCombined {...base(p)} />,
  Rupee: (p: LucideProps) => <IndianRupee {...base(p)} />,
  Bank: (p: LucideProps) => <Landmark {...base(p)} />,
  Languages: (p: LucideProps) => <Languages {...base(p)} />,
  Pin: (p: LucideProps) => <MapPin {...base(p)} />,
  Route: (p: LucideProps) => <Route {...base(p)} />,
  Risk: (p: LucideProps) => <ShieldAlert {...base(p)} />,
  Store: (p: LucideProps) => <Store {...base(p)} />,
  Trend: (p: LucideProps) => <TrendingUp {...base(p)} />,
  Truck: (p: LucideProps) => <Truck {...base(p)} />,
  Users: (p: LucideProps) => <Users {...base(p)} />,
  Wallet: (p: LucideProps) => <Wallet {...base(p)} />,
  Info: (p: LucideProps) => <Info {...base({ ...p, size: 13 })} />,
  Radar: (p: LucideProps) => <Radar {...base(p)} />,
  Scan: (p: LucideProps) => <ScanLine {...base(p)} />,
  Target: (p: LucideProps) => <Target {...base(p)} />,
  Verified: (p: LucideProps) => <CircleCheck {...base({ ...p, size: 12 })} />,
  Model: (p: LucideProps) => <FlaskConical {...base({ ...p, size: 12 })} />,
  DemoDb: (p: LucideProps) => <Database {...base({ ...p, size: 12 })} />,
  Play: (p: LucideProps) => <Play {...base({ ...p, size: 14 })} />,
};

export type IconName = keyof typeof Icon;
