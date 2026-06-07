import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: `Admin · ${BRAND}` }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState({ signups: 0, opps: 0, conns: 0, msgs: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      const ok = !!data?.some((r) => r.role === "admin");
      setIsAdmin(ok);
      if (!ok) return;
      supabase.from("reports").select("*").eq("status", "open").order("created_at", { ascending: false }).then(({ data }) => setReports(data ?? []));
      Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("opportunities").select("id", { count: "exact", head: true }),
        supabase.from("connections").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
      ]).then(([a, b, c, d]) => setStats({ signups: a.count ?? 0, opps: b.count ?? 0, conns: c.count ?? 0, msgs: d.count ?? 0 }));
    });
  }, [user]);

  if (isAdmin === null) return <div className="py-20 text-center">Loading...</div>;
  if (!isAdmin) return <div className="py-20 text-center text-muted-foreground">Not authorized.</div>;

  async function resolve(id: string, status: "actioned" | "dismissed") {
    await supabase.from("reports").update({ status, resolved_at: new Date().toISOString(), reviewer_id: user!.id }).eq("id", id);
    setReports((r) => r.filter((x) => x.id !== id));
    toast.success("Report resolved.");
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Admin</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Signups" value={stats.signups} />
        <Stat label="Opportunities" value={stats.opps} />
        <Stat label="Connections" value={stats.conns} />
        <Stat label="Messages" value={stats.msgs} />
      </div>

      <h2 className="mt-10 text-xl font-semibold">Open reports</h2>
      <div className="mt-3 space-y-3">
        {reports.length === 0 ? <Card className="p-6 text-center text-muted-foreground">No open reports.</Card> : reports.map((r) => (
          <Card key={r.id} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <div className="font-semibold">{r.reason}</div>
              <div className="text-xs text-muted-foreground">{r.target_type} · {r.target_id.slice(0, 8)}</div>
              {r.notes && <p className="mt-1 text-sm text-muted-foreground">{r.notes}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={() => resolve(r.id, "actioned")}>Action</Button>
              <Button size="sm" variant="outline" onClick={() => resolve(r.id, "dismissed")}>Dismiss</Button>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-10 text-xs text-muted-foreground">User & opportunity moderation can be expanded here. <Link to="/discover" className="underline">Browse opportunities</Link>.</p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </Card>
  );
}
