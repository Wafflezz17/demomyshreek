import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/_authenticated/opportunities/$id/edit")({
  head: () => ({ meta: [{ title: `Edit opportunity · ${BRAND}` }] }),
  component: EditOpportunity,
});

function EditOpportunity() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { user } = useAuth();
  const [opp, setOpp] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("opportunities").select("*").eq("id", id).maybeSingle().then(({ data }) => setOpp(data));
  }, [id]);

  if (!opp) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  if (user?.id !== opp.owner_id) return <div className="py-20 text-center">Not allowed.</div>;

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("opportunities").update({
      title: opp.title, summary: opp.summary, description: opp.description, status: opp.status,
    }).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved.");
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">Edit opportunity</h1>
      <Card className="mt-6 space-y-4 p-6">
        <div><Label>Title</Label><Input value={opp.title} onChange={(e) => setOpp({ ...opp, title: e.target.value })} /></div>
        <div><Label>Summary</Label><Textarea value={opp.summary} onChange={(e) => setOpp({ ...opp, summary: e.target.value })} rows={2} /></div>
        <div><Label>Description</Label><Textarea value={opp.description} onChange={(e) => setOpp({ ...opp, description: e.target.value })} rows={10} /></div>
        <div>
          <Label>Status</Label>
          <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={opp.status} onChange={(e) => setOpp({ ...opp, status: e.target.value })}>
            <option value="live">Live</option>
            <option value="paused">Paused</option>
            <option value="removed">Removed</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild><Link to="/opportunities/$id" params={{ id }}>Cancel</Link></Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </Card>
    </main>
  );
}
