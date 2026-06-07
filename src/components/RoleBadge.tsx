import { Briefcase, Rocket, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; classes: string }> = {
  founder: { label: "Founder", icon: Rocket, classes: "bg-primary/10 text-primary border-primary/20" },
  professional: { label: "Professional", icon: Briefcase, classes: "bg-accent text-accent-foreground border-border" },
  investor: { label: "Investor", icon: TrendingUp, classes: "bg-gold/15 text-gold-foreground border-gold/30" },
};

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const m = META[role] ?? META.professional;
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", m.classes, className)}>
      <Icon className="size-3" /> {m.label}
    </span>
  );
}
