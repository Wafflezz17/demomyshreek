import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OPPORTUNITY_TYPES, OPPORTUNITY_STAGES, SEEKING, GEOGRAPHIES, screenOpportunityText, BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/_authenticated/opportunities/new")({
  head: () => ({ meta: [{ title: `List an opportunity · ${BRAND}` }] }),
  component: NewOpportunity,
});

function NewOpportunity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    description: "",
    sector_id: "",
    stage: "early",
    opportunity_type: "growth",
    location_country: "UAE",
    location_city: "",
    capital_band_min: "",
    capital_band_max: "",
    seeking: [] as string[],
    highlights: ["", "", ""],
  });

  useEffect(() => {
    supabase.from("sectors").select("id, name").order("sort_order").then(({ data }) => setSectors(data ?? []));
  }, []);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (form.title.trim().length < 3) return toast.error("Add a title.");
    if (!form.sector_id) return toast.error("Pick a sector.");

    const screening = screenOpportunityText(`${form.title} ${form.summary} ${form.description}`);
    setLoading(true);

    const { data, error } = await supabase
      .from("opportunities")
      .insert({
        owner_id: user.id,
        title: form.title.trim(),
        summary: form.summary.trim(),
        description: form.description.trim(),
        sector_id: form.sector_id,
        stage: form.stage as any,
        opportunity_type: form.opportunity_type as any,
        location_country: form.location_country || null,
        location_city: form.location_city || null,
        capital_band_min: form.capital_band_min ? Number(form.capital_band_min) : null,
        capital_band_max: form.capital_band_max ? Number(form.capital_band_max) : null,
        seeking: form.seeking as any,
        highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
        status: "live",
        screening_status: screening,
      })
      .select()
      .single();

    setLoading(false);
    if (error) {
      if (error.message.includes("trust_tier") || error.message.includes("row-level"))
        return toast.error("Complete your profile (60%) to publish opportunities. Visit My Profile.");
      return toast.error(error.message);
    }
    supabase.from("events").insert({ user_id: user.id, event_type: "opportunity_published", payload: { opportunity_id: data!.id } });
    toast.success("Opportunity published.");
    navigate({ to: "/opportunities/$id", params: { id: data!.id } });
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">List an opportunity</h1>
      <p className="mt-1 text-muted-foreground">Use clear, factual language. Don't use securities or investment terms — myShareek is for business partnerships and introductions only.</p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <Card className="space-y-4 p-6">
          <Field label="Title">
            <Input maxLength={120} value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="e.g. UAE grocery chain — expansion partner" required />
          </Field>
          <Field label="Short summary (1–2 lines, shown on cards)">
            <Textarea maxLength={240} rows={2} value={form.summary} onChange={(e) => setField("summary", e.target.value)} placeholder="One-line pitch of the opportunity" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Opportunity type">
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.opportunity_type} onChange={(e) => setField("opportunity_type", e.target.value)}>
                {OPPORTUNITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Stage">
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.stage} onChange={(e) => setField("stage", e.target.value)}>
                {OPPORTUNITY_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Sector">
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.sector_id} onChange={(e) => setField("sector_id", e.target.value)} required>
                <option value="">Select sector...</option>
                {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Country">
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.location_country} onChange={(e) => setField("location_country", e.target.value)}>
                {GEOGRAPHIES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="City (optional)">
              <Input value={form.location_city} onChange={(e) => setField("location_city", e.target.value)} placeholder="Dubai, Riyadh..." />
            </Field>
            <Field label="Capital band (AED, optional)">
              <div className="flex gap-2">
                <Input type="number" placeholder="Min" value={form.capital_band_min} onChange={(e) => setField("capital_band_min", e.target.value)} />
                <Input type="number" placeholder="Max" value={form.capital_band_max} onChange={(e) => setField("capital_band_max", e.target.value)} />
              </div>
            </Field>
          </div>
          <Field label="What you're seeking">
            <div className="flex flex-wrap gap-2">
              {SEEKING.map((s) => {
                const checked = form.seeking.includes(s.value);
                return (
                  <button type="button" key={s.value} onClick={() => setField("seeking", checked ? form.seeking.filter((x) => x !== s.value) : [...form.seeking, s.value])}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${checked ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </Card>

        <Card className="space-y-4 p-6">
          <Field label="Full description (problem, solution, why now, traction in ranges)">
            <Textarea rows={8} maxLength={4000} value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Describe the opportunity. Use traction ranges (e.g. 'AED 500K–2M annual revenue') rather than precise figures." required />
          </Field>
          <Field label="Key highlights (3 short bullets)">
            <div className="space-y-2">
              {form.highlights.map((h, i) => (
                <Input key={i} value={h} onChange={(e) => { const next = [...form.highlights]; next[i] = e.target.value; setField("highlights", next); }} placeholder={`Highlight ${i + 1}`} maxLength={140} />
              ))}
            </div>
          </Field>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/discover" })}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Publishing..." : "Publish opportunity"}</Button>
        </div>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm font-medium">{label}</Label>{children}</div>;
}
