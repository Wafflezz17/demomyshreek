import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PublicFooter } from "@/components/PublicFooter";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/Disclaimer";
import { BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: `Explore opportunities · ${BRAND}` },
      { name: "description", content: "Browse business and growth opportunities across the UAE and GCC. Sign in to request connections." },
      { property: "og:title", content: `Explore opportunities · ${BRAND}` },
      { property: "og:description", content: "Discover growth and strategic partnership opportunities across the UAE and GCC." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      supabase.from("opportunities").select("*").eq("status", "live").neq("screening_status", "under_review").order("created_at", { ascending: false }).limit(12),
      supabase.from("sectors").select("id, name"),
    ]).then(async ([oppRes, secRes]) => {
      const list = oppRes.data ?? [];
      const ownerIds = Array.from(new Set(list.map((o) => o.owner_id)));
      let owners: any[] = [];
      if (ownerIds.length > 0) {
        const { data } = await supabase.from("profiles").select("id, full_name, avatar_url, headline, verification_status, trust_tier").in("id", ownerIds);
        owners = data ?? [];
      }
      const ownerMap = Object.fromEntries(owners.map((o) => [o.id, o]));
      setOpps(list.map((o) => ({ ...o, owner: ownerMap[o.owner_id] })));
      setSectors(Object.fromEntries((secRes.data ?? []).map((s: any) => [s.id, s.name])));
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Explore opportunities</h1>
            <p className="mt-1 text-muted-foreground">A preview of what's on myShareek. Sign in to filter, save, and connect.</p>
          </div>
          <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Sign up to connect</Link></Button>
        </div>

        <div className="mb-6"><Disclaimer compact /></div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading opportunities...</div>
        ) : opps.length === 0 ? (
          <div className="rounded-lg border bg-secondary/30 p-12 text-center">
            <p className="text-muted-foreground">No opportunities yet. Be the first to list one.</p>
            <Button className="mt-4" asChild><Link to="/auth" search={{ mode: "signup" }}>List an opportunity</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {opps.map((o) => (
              <div key={o.id} className="relative">
                <OpportunityCard opportunity={o} owner={o.owner} sectorName={sectors[o.sector_id ?? ""]} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-lg border bg-primary/5 p-6 text-center">
          <Lock className="mx-auto size-5 text-primary" />
          <h3 className="mt-2 font-semibold">Want to request a connection?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Sign in or create a free account to view full details and connect with founders.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Create account</Link></Button>
            <Button variant="outline" asChild><Link to="/auth">Sign in</Link></Button>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
