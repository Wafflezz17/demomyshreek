import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Card } from "@/components/ui/card";
import { BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({ meta: [{ title: `Saved · ${BRAND}` }] }),
  component: SavedPage,
});

function SavedPage() {
  const { user } = useAuth();
  const [opps, setOpps] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: saved } = await supabase.from("saved_items").select("reference").eq("user_id", user.id).eq("item_type", "opportunity");
      const ids = (saved ?? []).map((s) => s.reference);
      if (!ids.length) return setOpps([]);
      const { data: rows } = await supabase.from("opportunities").select("*").in("id", ids);
      const ownerIds = Array.from(new Set((rows ?? []).map((r) => r.owner_id)));
      const { data: owners } = await supabase.from("profiles").select("id, full_name, avatar_url, headline, verification_status, trust_tier").in("id", ownerIds);
      const map = Object.fromEntries((owners ?? []).map((o: any) => [o.id, o]));
      setOpps((rows ?? []).map((r) => ({ ...r, owner: map[r.owner_id] })));
    })();
  }, [user]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Saved opportunities</h1>
      {opps.length === 0 ? (
        <Card className="mt-6 p-8 text-center text-muted-foreground">
          You haven't saved any opportunities yet. <Link to="/discover" className="text-primary hover:underline">Explore opportunities</Link>.
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opps.map((o) => <OpportunityCard key={o.id} opportunity={o} owner={o.owner} />)}
        </div>
      )}
    </main>
  );
}
