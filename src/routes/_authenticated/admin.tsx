import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BRAND, ROLE_LABEL, type DbRole } from "@/lib/myshareek";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: `Admin · ${BRAND}` }] }),
  component: AdminPage,
});

type PendingUser = {
  id: string;
  full_name: string | null;
  role: DbRole;
  headline: string | null;
  location: string | null;
  location_country: string | null;
  location_city: string | null;
  linkedin_url: string | null;
  profile_completeness: number;
  created_at: string;
};

function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [stats, setStats] = useState({ signups: 0, opps: 0, conns: 0, msgs: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      const ok = !!data?.some((r) => r.role === "admin");
      setIsAdmin(ok);
      if (!ok) return;
      loadPending();
      supabase.from("reports").select("*").eq("status", "open").order("created_at", { ascending: false }).then(({ data }) => setReports(data ?? []));
      Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("opportunities").select("id", { count: "exact", head: true }),
        supabase.from("connections").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
      ]).then(([a, b, c, d]) => setStats({ signups: a.count ?? 0, opps: b.count ?? 0, conns: c.count ?? 0, msgs: d.count ?? 0 }));
    });
  }, [user]);

  async function loadPending() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, headline, location, location_country, location_city, linkedin_url, profile_completeness, created_at")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true });
    setPending((data ?? []) as PendingUser[]);
  }

  if (isAdmin === null) return <div className="py-20 text-center">Loading...</div>;
  if (!isAdmin) return <div className="py-20 text-center text-muted-foreground">Not authorized.</div>;

  async function resolve(id: string, status: "actioned" | "dismissed") {
    await supabase.from("reports").update({ status, resolved_at: new Date().toISOString(), reviewer_id: user!.id }).eq("id", id);
    setReports((r) => r.filter((x) => x.id !== id));
    toast.success("Report resolved.");
  }

  async function notify(userId: string, decision: "approved" | "rejected", rejectionReason?: string) {
    try {
      await supabase.functions.invoke("notify-approval", {
        body: { user_id: userId, decision, rejection_reason: rejectionReason ?? null },
      });
    } catch {
      // Non-blocking: in-app notification still inserted server-side by the function
    }
  }

  async function approve(u: PendingUser) {
    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: "approved",
        approved_by: user!.id,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq("id", u.id);
    if (error) return toast.error(error.message);
    setPending((p) => p.filter((x) => x.id !== u.id));
    toast.success(`Approved ${u.full_name ?? "user"}`);
    notify(u.id, "approved");
  }

  async function reject(u: PendingUser) {
    if (reason.trim().length < 3) return toast.error("Please enter a short reason.");
    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: "rejected",
        approved_by: user!.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason.trim(),
      })
      .eq("id", u.id);
    if (error) return toast.error(error.message);
    setPending((p) => p.filter((x) => x.id !== u.id));
    setRejectingId(null);
    notify(u.id, "rejected", reason.trim());
    setReason("");
    toast.success(`Rejected ${u.full_name ?? "user"}`);
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

      <h2 className="mt-10 text-xl font-semibold">
        Pending approvals <span className="text-muted-foreground">({pending.length})</span>
      </h2>
      <div className="mt-3 space-y-3">
        {pending.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">No pending users.</Card>
        ) : (
          pending.map((u) => (
            <Card key={u.id} className="p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{u.full_name ?? "Unnamed"}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{ROLE_LABEL[u.role]}</span>
                    <span className="text-xs text-muted-foreground">{u.profile_completeness}% complete</span>
                  </div>
                  {u.headline && <div className="mt-1 text-sm text-muted-foreground">{u.headline}</div>}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[u.location_city, u.location_country ?? u.location].filter(Boolean).join(", ") || "Location not set"}
                  </div>
                  {u.linkedin_url && (
                    <a href={u.linkedin_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary underline">
                      LinkedIn
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approve(u)}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => { setRejectingId(u.id); setReason(""); }}>
                    Reject
                  </Button>
                </div>
              </div>
              {rejectingId === u.id && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <Textarea
                    placeholder="Reason for rejection (shown to the user)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => reject(u)}>Confirm reject</Button>
                    <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setReason(""); }}>Cancel</Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
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

      <p className="mt-10 text-xs text-muted-foreground">
        <Link to="/discover" className="underline">Browse opportunities</Link>.
      </p>
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
