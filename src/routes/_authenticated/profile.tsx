import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { INDUSTRIES, SKILLS, STAGES, EXPERIENCE_LEVELS, AVAILABILITY } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My profile · myShareek" }] }),
  component: ProfileEdit,
});

function ProfileEdit() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [details, setDetails] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(p);
      const table = p?.role === "founder" ? "founder_details" : p?.role === "investor" ? "investor_details" : "professional_details";
      const { data: d } = await supabase.from(table).select("*").eq("user_id", user.id).maybeSingle();
      setDetails(d ?? {});
    })();
  }, [user]);

  async function save() {
    if (!user || !profile) return;
    setSaving(true);
    const { error: pe } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        location: profile.location,
        location_country: profile.location_country,
        location_city: profile.location_city,
        headline: profile.headline,
        linkedin_url: profile.linkedin_url,
        bio: profile.bio,
      })
      .eq("id", user.id);
    if (pe) { setSaving(false); return toast.error(pe.message); }

    const table = profile.role === "founder" ? "founder_details" : profile.role === "investor" ? "investor_details" : "professional_details";
    // Strip server-managed columns from the upsert payload
    const { updated_at: _u, ...detailsToSave } = (details ?? {}) as Record<string, unknown>;
    const payload = { user_id: user.id, ...detailsToSave };
    const { error: de } = await supabase.from(table).upsert(payload, { onConflict: "user_id" });
    if (de) { setSaving(false); return toast.error(de.message); }

    // Refetch so profile_completeness shown matches what the DB trigger just recomputed
    const { data: fresh } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (fresh) setProfile(fresh);
    setSaving(false);
    toast.success("Profile saved");
  }

  if (!profile) return <div className="container mx-auto p-8">Loading...</div>;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">My profile</h1>
          <div className="mt-2 flex items-center gap-2">
            <RoleBadge role={profile.role} />
            <Link to="/u/$id" params={{ id: user!.id }} className="text-sm text-primary hover:underline">View public profile →</Link>
          </div>
        </div>
        <Button onClick={save} disabled={saving}><Save className="mr-2 size-4" /> {saving ? "Saving..." : "Save changes"}</Button>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold">Basics</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar className="size-16">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-primary text-primary-foreground">{(profile.full_name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input id="avatar" value={profile.avatar_url ?? ""} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} placeholder="https://..." />
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Full name"><Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></Field>
          <Field label="Location"><Input value={profile.location ?? ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="City, Country" /></Field>
          
          <Field label="Bio" className="md:col-span-2"><Textarea rows={4} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell others about yourself..." /></Field>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-display text-lg font-semibold">
          {profile.role === "founder" ? "Your startup" : profile.role === "investor" ? "Investment focus" : "Skills & availability"}
        </h2>

        {profile.role === "founder" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Startup name"><Input value={details.startup_name ?? ""} onChange={(e) => setDetails({ ...details, startup_name: e.target.value })} /></Field>
            <Field label="Industry">
              <SelectControl value={details.industry} onChange={(v) => setDetails({ ...details, industry: v })} options={INDUSTRIES.map((i) => ({ value: i, label: i }))} placeholder="Pick an industry" />
            </Field>
            <Field label="Stage">
              <SelectControl value={details.stage} onChange={(v) => setDetails({ ...details, stage: v })} options={STAGES.map((s) => ({ value: s.value, label: s.label }))} placeholder="Pick a stage" />
            </Field>
            <Field label="Funding required (USD)"><Input type="number" value={details.funding_required ?? ""} onChange={(e) => setDetails({ ...details, funding_required: e.target.value ? Number(e.target.value) : null })} /></Field>
            <Field label="Funding status"><Input value={details.funding_status ?? ""} onChange={(e) => setDetails({ ...details, funding_status: e.target.value })} placeholder="e.g. Raising pre-seed" /></Field>
            <Field label="Team size"><Input type="number" value={details.team_size ?? ""} onChange={(e) => setDetails({ ...details, team_size: e.target.value ? Number(e.target.value) : null })} /></Field>
            <Field label="Equity offered" className="md:col-span-2"><Input value={details.equity_offered ?? ""} onChange={(e) => setDetails({ ...details, equity_offered: e.target.value })} placeholder="e.g. 1–5% for early hires" /></Field>
            <Field label="Startup description" className="md:col-span-2"><Textarea rows={4} value={details.startup_description ?? ""} onChange={(e) => setDetails({ ...details, startup_description: e.target.value })} /></Field>
            <Field label="Skills you need" className="md:col-span-2">
              <ChipsEditor value={details.skills_needed ?? []} options={SKILLS as unknown as string[]} onChange={(v) => setDetails({ ...details, skills_needed: v })} />
            </Field>
          </div>
        )}

        {profile.role === "professional" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Experience level">
              <SelectControl value={details.experience_level} onChange={(v) => setDetails({ ...details, experience_level: v })} options={EXPERIENCE_LEVELS.map((e) => ({ value: e.value, label: e.label }))} placeholder="Pick a level" />
            </Field>
            <Field label="Availability">
              <SelectControl value={details.availability} onChange={(v) => setDetails({ ...details, availability: v })} options={AVAILABILITY.map((a) => ({ value: a.value, label: a.label }))} placeholder="Pick availability" />
            </Field>
            <Field label="Your skills" className="md:col-span-2">
              <ChipsEditor value={details.skills ?? []} options={SKILLS as unknown as string[]} onChange={(v) => setDetails({ ...details, skills: v })} />
            </Field>
            <Field label="Industries of interest" className="md:col-span-2">
              <ChipsEditor value={details.industries ?? []} options={INDUSTRIES as unknown as string[]} onChange={(v) => setDetails({ ...details, industries: v })} />
            </Field>
            <Field label="Portfolio links" className="md:col-span-2">
              <LinkListEditor value={details.portfolio_links ?? []} onChange={(v) => setDetails({ ...details, portfolio_links: v })} />
            </Field>
          </div>
        )}

        {profile.role === "investor" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Min check (USD)"><Input type="number" value={details.investment_range_min ?? ""} onChange={(e) => setDetails({ ...details, investment_range_min: e.target.value ? Number(e.target.value) : null })} /></Field>
            <Field label="Max check (USD)"><Input type="number" value={details.investment_range_max ?? ""} onChange={(e) => setDetails({ ...details, investment_range_max: e.target.value ? Number(e.target.value) : null })} /></Field>
            <Field label="Investment interests" className="md:col-span-2"><Textarea rows={3} value={details.investment_interests ?? ""} onChange={(e) => setDetails({ ...details, investment_interests: e.target.value })} placeholder="What kind of startups excite you?" /></Field>
            <Field label="Preferred industries" className="md:col-span-2">
              <ChipsEditor value={details.preferred_industries ?? []} options={INDUSTRIES as unknown as string[]} onChange={(v) => setDetails({ ...details, preferred_industries: v })} />
            </Field>
            <Field label="Preferred stages" className="md:col-span-2">
              <ChipsEditor value={details.preferred_stages ?? []} options={STAGES.map((s) => s.value)} labels={Object.fromEntries(STAGES.map((s) => [s.value, s.label]))} onChange={(v) => setDetails({ ...details, preferred_stages: v })} />
            </Field>
          </div>
        )}
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving} size="lg"><Save className="mr-2 size-4" /> {saving ? "Saving..." : "Save changes"}</Button>
      </div>
    </main>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SelectControl({ value, onChange, options, placeholder }: { value: string | undefined; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string }) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function ChipsEditor({ value, options, labels, onChange }: { value: string[]; options: string[]; labels?: Record<string, string>; onChange: (v: string[]) => void }) {
  const [pick, setPick] = useState("");
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const remaining = options.filter((o) => !value.includes(o));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 && <span className="text-sm text-muted-foreground">None selected yet.</span>}
        {value.map((v) => (
          <button key={v} onClick={() => toggle(v)} type="button" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20">
            {labels?.[v] ?? v} <X className="size-3" />
          </button>
        ))}
      </div>
      {remaining.length > 0 && (
        <div className="flex gap-2">
          <Select value={pick} onValueChange={(v) => { setPick(""); toggle(v); }}>
            <SelectTrigger><SelectValue placeholder="Add..." /></SelectTrigger>
            <SelectContent>
              {remaining.map((o) => <SelectItem key={o} value={o}>{labels?.[o] ?? o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function LinkListEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={v} onChange={(e) => { const next = [...value]; next[i] = e.target.value; onChange(next); }} />
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))}><X className="size-4" /></Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input placeholder="https://..." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && draft) { e.preventDefault(); onChange([...value, draft]); setDraft(""); } }} />
        <Button type="button" variant="outline" onClick={() => { if (draft) { onChange([...value, draft]); setDraft(""); } }}><Plus className="size-4" /></Button>
      </div>
    </div>
  );
}
