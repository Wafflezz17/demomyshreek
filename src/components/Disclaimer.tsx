import { Info } from "lucide-react";
import { DISCLAIMER } from "@/lib/myshareek";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex gap-2 rounded-lg border bg-muted/40 ${compact ? "p-3 text-xs" : "p-4 text-sm"} text-muted-foreground`}>
      <Info className="size-4 shrink-0 mt-0.5" />
      <p>{DISCLAIMER}</p>
    </div>
  );
}
