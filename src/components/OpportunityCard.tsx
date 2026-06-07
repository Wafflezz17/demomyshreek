import { Link } from "@tanstack/react-router";
import { MapPin, Building2, BadgeCheck } from "lucide-react";
import type { Opportunity } from "@/lib/myshareek";
import { OPPORTUNITY_TYPES, OPPORTUNITY_STAGES, formatCapitalBand } from "@/lib/myshareek";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Owner = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  verification_status: string | null;
  trust_tier: string | null;
};

export function OpportunityCard({
  opportunity,
  owner,
  sectorName,
}: {
  opportunity: Opportunity;
  owner: Owner | null;
  sectorName?: string;
}) {
  const typeLabel = OPPORTUNITY_TYPES.find((t) => t.value === opportunity.opportunity_type)?.label ?? opportunity.opportunity_type;
  const stageLabel = OPPORTUNITY_STAGES.find((s) => s.value === opportunity.stage)?.label ?? opportunity.stage;
  const verified = owner?.verification_status === "verified";
  const fresh = Date.now() - new Date(opportunity.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  const initials = (owner?.full_name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Link to="/opportunities/$id" params={{ id: opportunity.id }} className="block group h-full">
      <Card className="flex h-full flex-col gap-3 p-5 transition-all group-hover:border-primary/40 group-hover:shadow-elegant">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-xs font-semibold text-primary">{typeLabel}</span>
            {sectorName && <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{sectorName}</span>}
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{stageLabel}</span>
          </div>
          {(verified || fresh) && (
            <div className="flex shrink-0 gap-1">
              {verified && <BadgeCheck className="size-4 text-verified" />}
              {fresh && <span className="rounded-full bg-verified/12 px-1.5 py-0.5 text-[10px] font-semibold text-verified">NEW</span>}
            </div>
          )}
        </div>

        <h3 className="font-semibold leading-tight text-foreground line-clamp-2">{opportunity.title}</h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">{opportunity.summary}</p>

        <div className="mt-auto space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" />{opportunity.location_city ?? opportunity.location_country ?? "—"}</span>
            <span className="flex items-center gap-1"><Building2 className="size-3.5" />{formatCapitalBand(opportunity.capital_band_min ? Number(opportunity.capital_band_min) : null, opportunity.capital_band_max ? Number(opportunity.capital_band_max) : null)}</span>
          </div>

          {owner && (
            <div className="flex items-center gap-2 border-t pt-3">
              <Avatar className="size-7">
                {owner.avatar_url && <AvatarImage src={owner.avatar_url} alt={owner.full_name ?? ""} />}
                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                  <span className="truncate">{owner.full_name ?? "Founder"}</span>
                  {verified && <BadgeCheck className="size-3.5 shrink-0 text-verified" />}
                </div>
                {owner.headline && <div className="truncate text-xs text-muted-foreground">{owner.headline}</div>}
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
