// myShareek domain constants & helpers
import type { Database } from "@/integrations/supabase/types";

export const BRAND = "myShareek";
export const TAGLINE = "Where opportunities meet partners.";
export const DISCLAIMER =
  "Introductions only — myShareek never handles money, equity, contracts, or negotiations. Opportunities are not verified or endorsed by myShareek. Do your own due diligence.";

// Role mapping (DB enum uses legacy values; we display new labels)
export type DbRole = "founder" | "professional" | "investor" | "admin";
export type DisplayRole = "entrepreneur" | "expert" | "investor" | "admin";

export const ROLE_LABEL: Record<DbRole, string> = {
  founder: "Entrepreneur",
  professional: "Expert",
  investor: "Investor",
  admin: "Admin",
};

export const toDisplayRole = (r: DbRole | null | undefined): DisplayRole => {
  if (r === "founder") return "entrepreneur";
  if (r === "professional") return "expert";
  return (r as DisplayRole) ?? "expert";
};

export const OPPORTUNITY_TYPES = [
  { value: "growth", label: "Growth Opportunity", desc: "Scale an established business" },
  { value: "strategic_partnership", label: "Strategic Partnership", desc: "Partner to expand reach or capability" },
  { value: "funding_partner", label: "Funding Partner", desc: "Seeking a funding partner to fuel growth" },
  { value: "expansion", label: "Market Expansion", desc: "Enter a new region or vertical" },
] as const;

export const OPPORTUNITY_STAGES = [
  { value: "idea", label: "Idea" },
  { value: "early", label: "Early" },
  { value: "growth", label: "Growth" },
  { value: "established", label: "Established" },
] as const;

export const SEEKING = [
  { value: "funding_partner", label: "Funding partner" },
  { value: "strategic_partner", label: "Strategic partner" },
  { value: "both", label: "Both" },
] as const;

export const GEOGRAPHIES = ["UAE", "Saudi Arabia"];

export const INVESTOR_TYPES = [
  { value: "angel", label: "Angel" },
  { value: "strategic", label: "Strategic" },
  { value: "company", label: "Company" },
  { value: "operator_partner", label: "Operator partner" },
] as const;

export const INVESTOR_BRINGS = [
  { value: "capital", label: "Capital" },
  { value: "expertise", label: "Expertise" },
  { value: "both", label: "Both" },
] as const;

export const REPORT_REASONS = [
  "Scam / fraudulent",
  "Misleading claims",
  "Prohibited content",
  "Securities / investment language",
  "Spam",
  "Other",
];

// Capital bands (display in AED-style ranges)
export const CAPITAL_BANDS = [
  { min: 0, max: 100_000, label: "Under AED 100K" },
  { min: 100_000, max: 500_000, label: "AED 100K–500K" },
  { min: 500_000, max: 2_000_000, label: "AED 500K–2M" },
  { min: 2_000_000, max: 10_000_000, label: "AED 2M–10M" },
  { min: 10_000_000, max: 50_000_000, label: "AED 10M+" },
];

export function formatCapitalBand(min: number | null, max: number | null) {
  if (min == null && max == null) return "Seeking partner";
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` :
    n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`;
  if (min != null && max != null) return `AED ${fmt(min)}–${fmt(max)}`;
  if (min != null) return `AED ${fmt(min)}+`;
  return `Up to AED ${fmt(max!)}`;
}

// Lightweight client-side opportunity screening
const FLAGGED_KEYWORDS = [
  "guaranteed returns", "guaranteed roi", "risk free", "risk-free", "double your money",
  "passive income guaranteed", "crypto giveaway", "send btc", "wire transfer", "western union",
  "securities offering", "buy shares", "ipo presale", "pump and dump", "tokensale", "ico ",
];

export function screenOpportunityText(text: string): "clear" | "flagged" {
  const lower = text.toLowerCase();
  return FLAGGED_KEYWORDS.some((k) => lower.includes(k)) ? "flagged" : "clear";
}

export type Tables = Database["public"]["Tables"];
export type Opportunity = Tables["opportunities"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type Connection = Tables["connections"]["Row"];

export const RATE_LIMITS = {
  connectionsPerDay: { active: 10, verified: 25 },
  liveOpportunities: { active: 5, verified: 20 },
};
