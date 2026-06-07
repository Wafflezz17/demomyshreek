import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BRAND, INVESTOR_TYPES, GEOGRAPHIES } from "@/lib/myshareek";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({ meta: [{ title: `My focus · ${BRAND}` }] }),
  component: FocusPage,
});

function FocusPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("investor_profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setData(data ?? { user_id: user.id }));
    supabase.from("sectors").select("id, name").order("sort_order").then(({ data }) => setSectors(data ?? []));
  }, [user]);

  if (!data) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("investor_profiles").upsert(data);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Preferences saved.");
    supabase.rpc("recompute_profile_completeness", { _user_id: user!.id });
  }
  const toggleSector = (id: string) => setData({ ...data, preferred_sectors: data.preferred_sectors?.includes(id) ? data.preferred_sectors.filter((s: string) => s !== id) : [...(data.preferred_sectors ?? []), id] });

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">My focus</h1>
      <p className="mt-1 text-muted-foreground">Define your focus so we can surface relevant opportunities.</p>
      <Card className="mt-6 space-y-5 p-6">
        <div>
          <Label>I am a...</Label>
          <select className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" value={data.investor_type ?? ""} onChange={(e) => setData({ ...data, investor_type: e.target.value || null })}>
            <option value="">Select...</option>
            {INVESTOR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <Label>Focus summary</Label>
          <Textarea rows={3} maxLength={400} value={data.focus_summary ?? ""} onChange={(e) => setData({ ...data, focus_summary: e.target.value })} placeholder="What kinds of opportunities interest you?" />
        </div>
        <div>
          <Label>Preferred sectors</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {sectors.map((s) => {
              const on = data.preferred_sectors?.includes(s.id);
              return <button type="button" key={s.id} onClick={() => toggleSector(s.id)} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}>{s.name}</button>;
            })}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Ticket min (AED)</Label><Input type="number" value={data.ticket_min ?? ""} onChange={(e) => setData({ ...data, ticket_min: e.target.value ? Number(e.target.value) : null })} /></div>
          <div><Label>Ticket max (AED)</Label><Input type="number" value={data.ticket_max ?? ""} onChange={(e) => setData({ ...data, ticket_max: e.target.value ? Number(e.target.value) : null })} /></div>
        </div>
        <div>
          <Label>Geographies</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {GEOGRAPHIES.map((g) => {
              const on = data.geographies?.includes(g);
              return <button type="button" key={g} onClick={() => setData({ ...data, geographies: on ? data.geographies.filter((x: string) => x !== g) : [...(data.geographies ?? []), g] })} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}>{g}</button>;
            })}
          </div>
        </div>
        <div>
          <Label>Profile visibility</Label>
          <select className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" value={data.profile_visibility ?? "public"} onChange={(e) => setData({ ...data, profile_visibility: e.target.value })}>
            <option value="public">Public — visible to all authenticated users</option>
            <option value="on_connection">Private — revealed only on accepted connection</option>
          </select>
        </div>
        <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save preferences"}</Button></div>
      </Card>
    </main>
  );
}
