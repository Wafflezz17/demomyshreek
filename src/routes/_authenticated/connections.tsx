import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/_authenticated/connections")({
  head: () => ({ meta: [{ title: `Connections · ${BRAND}` }] }),
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"incoming" | "outgoing" | "accepted">("incoming");
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    let q = supabase.from("connections").select("*, opportunity:opportunities(id, title)").order("created_at", { ascending: false });
    if (tab === "incoming") q = q.eq("recipient_id", user.id).eq("status", "pending");
    else if (tab === "outgoing") q = q.eq("requester_id", user.id);
    else q = q.eq("status", "accepted");
    const { data } = await q;
    const list = data ?? [];
    const otherIds = Array.from(new Set(list.map((c: any) => (c.requester_id === user.id ? c.recipient_id : c.requester_id))));
    const { data: profiles } = otherIds.length ? await supabase.from("profiles").select("id, full_name, avatar_url, headline, verification_status").in("id", otherIds) : { data: [] };
    const map = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
    setRows(list.map((c: any) => ({ ...c, other: map[c.requester_id === user.id ? c.recipient_id : c.requester_id] })));
  };
  useEffect(() => { load(); }, [user, tab]);

  async function accept(id: string) {
    const { error } = await supabase.rpc("accept_connection", { _connection_id: id });
    if (error) return toast.error(error.message);
    toast.success("Connection accepted. You can now message.");
    load();
  }
  async function decline(id: string) {
    await supabase.from("connections").update({ status: "declined", responded_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Connections</h1>
      <div className="mt-4 inline-flex rounded-md border p-1">
        {(["incoming", "outgoing", "accepted"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded px-4 py-1.5 text-sm font-medium capitalize ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{t}</button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {rows.length === 0 ? <Card className="p-8 text-center text-muted-foreground">No {tab} connections.</Card> : rows.map((c) => (
          <Card key={c.id} className="flex items-center gap-4 p-4">
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{c.other?.full_name ?? "Unknown"}</div>
              {c.other?.headline && <div className="text-xs text-muted-foreground">{c.other.headline}</div>}
              {c.opportunity && <div className="mt-1 text-xs">re: <Link to="/opportunities/$id" params={{ id: c.opportunity.id }} className="text-primary hover:underline">{c.opportunity.title}</Link></div>}
              {c.intro_message && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">"{c.intro_message}"</p>}
            </div>
            <div className="flex gap-2">
              {tab === "incoming" && c.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => accept(c.id)}><Check className="mr-1 size-4" />Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => decline(c.id)}><X className="mr-1 size-4" />Decline</Button>
                </>
              )}
              {tab === "accepted" && c.other && <Button size="sm" variant="outline" asChild><Link to="/messages">Message</Link></Button>}
              {tab === "outgoing" && <span className="text-xs capitalize text-muted-foreground">{c.status}</span>}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
