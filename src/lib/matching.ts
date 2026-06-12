// Rule-based "Fits Your Focus" matching for investors

export type MatchInvestor = {
  preferred_sectors?: string[] | null;
  preferred_stages?: string[] | null;
  ticket_min?: number | null;
  ticket_max?: number | null;
  geographies?: string[] | null;
};

export type MatchOpportunity = {
  id: string;
  sector_id?: string | null;
  stage?: string | null;
  capital_band_min?: number | null;
  capital_band_max?: number | null;
  location_country?: string | null;
};

export type MatchResult = {
  score: number; // 0–100
  reasons: string[];
  matchedFacets: Array<"sector" | "stage" | "capital" | "geography">;
};

// Weights sum to 100
const W = { sector: 35, stage: 25, capital: 25, geography: 15 };

function rangesOverlap(aMin: number | null | undefined, aMax: number | null | undefined, bMin: number | null | undefined, bMax: number | null | undefined) {
  const lo1 = aMin ?? -Infinity, hi1 = aMax ?? Infinity;
  const lo2 = bMin ?? -Infinity, hi2 = bMax ?? Infinity;
  return lo1 <= hi2 && lo2 <= hi1;
}

export function scoreOpportunity(opp: MatchOpportunity, inv: MatchInvestor, sectorNameById?: Record<string, string>): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  const matchedFacets: MatchResult["matchedFacets"] = [];

  // Sector
  const sectors = inv.preferred_sectors ?? [];
  if (opp.sector_id && sectors.length > 0 && sectors.includes(opp.sector_id)) {
    score += W.sector;
    matchedFacets.push("sector");
    const name = sectorNameById?.[opp.sector_id] ?? "your sector";
    reasons.push(`Matches your sector focus (${name})`);
  }

  // Stage
  const stages = inv.preferred_stages ?? [];
  if (opp.stage && stages.length > 0 && stages.includes(opp.stage)) {
    score += W.stage;
    matchedFacets.push("stage");
    reasons.push(`Stage matches your focus (${opp.stage})`);
  }

  // Capital band overlap
  const invHasTicket = inv.ticket_min != null || inv.ticket_max != null;
  const oppHasBand = opp.capital_band_min != null || opp.capital_band_max != null;
  if (invHasTicket && oppHasBand && rangesOverlap(inv.ticket_min, inv.ticket_max, opp.capital_band_min, opp.capital_band_max)) {
    score += W.capital;
    matchedFacets.push("capital");
    reasons.push("Capital range overlaps with your ticket size");
  }

  // Geography
  const geos = inv.geographies ?? [];
  if (opp.location_country && geos.length > 0 && geos.includes(opp.location_country)) {
    score += W.geography;
    matchedFacets.push("geography");
    reasons.push(`In your geography (${opp.location_country})`);
  }

  return { score, reasons, matchedFacets };
}

export function rankOpportunities<T extends MatchOpportunity>(
  opportunities: T[],
  inv: MatchInvestor,
  sectorNameById?: Record<string, string>,
): Array<T & { match: MatchResult }> {
  return opportunities
    .map((o) => ({ ...o, match: scoreOpportunity(o, inv, sectorNameById) }))
    .sort((a, b) => b.match.score - a.match.score);
}
