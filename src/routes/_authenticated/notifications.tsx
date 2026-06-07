import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications · VentureHub" }] }),
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      setItems(data ?? []);
    })();
  }, [user]);

  async function markAllRead() {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((cur) => cur.map((n) => ({ ...n, read: true })));
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Notifications</h1>
        {items.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllRead}><Check className="mr-1 size-4" /> Mark all read</Button>
        )}
      </div>
      {items.length === 0 ? (
        <Card className="text-center">
          <Bell className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">You're all caught up.</p>
          <Button className="mt-4" asChild><Link to="/discover">Discover people</Link></Button>
        </Card>
      ) : (
        <Card className="divide-y">
          {items.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 p-4 ${!n.read ? "bg-primary/4" : ""}`}>
              <div className="mt-0.5 size-2 rounded-full bg-primary" style={{ visibility: n.read ? "hidden" : "visible" }} />
              <div className="flex-1">
                <div className="font-semibold">{n.title}</div>
                {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                <div className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {n.link && <Button variant="ghost" size="sm" asChild><Link to={n.link}>Open</Link></Button>}
            </div>
          ))}
        </Card>
      )}
    </main>
  );
}
