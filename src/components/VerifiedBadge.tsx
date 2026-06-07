import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";

export function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const cls = size === "md" ? "size-5" : "size-4";
  return (
    <span title="Verified" className="inline-flex items-center gap-1 rounded-full bg-verified/10 px-2 py-0.5 text-xs font-semibold text-verified">
      <BadgeCheck className={cls} /> Verified
    </span>
  );
}

export function TrustTierChip({ tier }: { tier: string }) {
  if (tier === "verified")
    return <VerifiedBadge />;
  if (tier === "active")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary">
        <ShieldCheck className="size-3.5" /> Active
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Sparkles className="size-3.5" /> Registered
    </span>
  );
}
