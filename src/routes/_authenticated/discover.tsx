import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Disclaimer } from "@/components/Disclaimer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BadgeCheck } from "lucide-react";
import { OPPORTUNITY_TYPES, OPPORTUNITY_STAGES, BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: `Opportunities · ${BRAND}` }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const [opps, setOpps] = useState<any[]>([]);
  const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    supabase
      .from("sectors")
      .select("id, name")
      .order("sort_order")
      .then(({ data }) => setSectors(data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    (async () => {
      let query = supabase
        .from("opportunities")
        .select("*")
        .eq("status", "live")
        .neq("screening_status", "under_review")
        .order("created_at", { ascending: false })
        .limit(60);
      if (sector) query = query.eq("sector_id", sector);
      if (type) query = query.eq("opportunity_type", type as any);
      if (stage) query = query.eq("stage", stage as any);
      const { data: list } = await query;
      const rows = list ?? [];
      const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id)));
      const { data: owners } = ownerIds.length
        ? await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, headline, verification_status, trust_tier")
            .in("id", ownerIds)
        : { data: [] as any[] };
      const map = Object.fromEntries((owners ?? []).map((o: any) => [o.id, o]));
      let merged = rows.map((r) => ({ ...r, owner: map[r.owner_id] }));
      if (verifiedOnly) merged = merged.filter((m) => m.owner?.verification_status === "verified");
      if (q.trim()) {
        const needle = q.toLowerCase();
        merged = merged.filter(
          (m) => m.title.toLowerCase().includes(needle) || m.summary.toLowerCase().includes(needle),
        );
      }
      // verified-first sort
      merged.sort(
        (a, b) =>
          Number(b.owner?.verification_status === "verified") - Number(a.owner?.verification_status === "verified"),
      );
      setOpps(merged);
      setLoading(false);
    })();
  }, [sector, type, stage, verifiedOnly, q]);

  const sectorName = (id: string | null) => sectors.find((s) => s.id === id)?.name;

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Opportunities</h1>
        <p className="text-muted-foreground">Discover business and growth opportunities across the KSA and UAE.</p>
      </header>
      <Disclaimer compact />

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-5">
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search opportunities"
                className="pl-9"
              />
            </div>
          </div>
          <FilterSelect
            label="Sector"
            value={sector}
            onChange={setSector}
            options={sectors.map((s) => ({ value: s.id, label: s.name }))}
          />
          <FilterSelect
            label="Type"
            value={type}
            onChange={setType}
            options={OPPORTUNITY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
          <FilterSelect
            label="Stage"
            value={stage}
            onChange={setStage}
            options={OPPORTUNITY_STAGES.map((s) => ({ value: s.value, label: s.label }))}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="accent-verified"
            />
            Verified only
          </label>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setSector("");
              setType("");
              setStage("");
              setVerifiedOnly(false);
              setQ("");
            }}
          >
            Clear filters
          </Button>
        </aside>

        <section>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Loading...</div>
          ) : opps.length === 0 ? (
            <div className="rounded-lg border bg-secondary/30 p-12 text-center">
              <p className="text-muted-foreground">No opportunities match your filters.</p>
              <Button variant="link" asChild>
                <Link to="/opportunities/new">List the first opportunity</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-3 text-sm text-muted-foreground">
                {opps.length} opportunit{opps.length === 1 ? "y" : "ies"} · Verified first
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {opps.map((o) => (
                  <OpportunityCard key={o.id} opportunity={o} owner={o.owner} sectorName={sectorName(o.sector_id)} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
