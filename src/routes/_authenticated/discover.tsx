import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ProfileCard, type ProfileCardData } from "@/components/ProfileCard";
import { INDUSTRIES, SKILLS, STAGES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover · VentureHub" }] }),
  component: Discover,
});

type Tab = "all" | "founder" | "professional" | "investor";

function Discover() {
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [skill, setSkill] = useState<string>("");
  const [location, setLocation] = useState("");

  const [profiles, setProfiles] = useState<any[]>([]);
  const [founderMap, setFounderMap] = useState<Record<string, any>>({});
  const [proMap, setProMap] = useState<Record<string, any>>({});
  const [invMap, setInvMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from("profiles").select("id, full_name, avatar_url, location, bio, role").limit(60);
      if (tab !== "all") query = query.eq("role", tab);
      if (location.trim()) query = query.ilike("location", `%${location.trim()}%`);
      if (q.trim()) query = query.or(`full_name.ilike.%${q.trim()}%,bio.ilike.%${q.trim()}%`);
      const { data } = await query;
      setProfiles(data ?? []);

      const ids = (data ?? []).map((p) => p.id);
      if (ids.length) {
        const [f, p, i] = await Promise.all([
          supabase.from("founder_details").select("*").in("user_id", ids),
          supabase.from("professional_details").select("*").in("user_id", ids),
          supabase.from("investor_details").select("*").in("user_id", ids),
        ]);
        setFounderMap(Object.fromEntries((f.data ?? []).map((r: any) => [r.user_id, r])));
        setProMap(Object.fromEntries((p.data ?? []).map((r: any) => [r.user_id, r])));
        setInvMap(Object.fromEntries((i.data ?? []).map((r: any) => [r.user_id, r])));
      }
      setLoading(false);
    })();
  }, [tab, q, location]);

  const filtered = useMemo<ProfileCardData[]>(() => {
    return profiles
      .map((p) => {
        let tagline: string | null = null;
        let chips: string[] = [];
        if (p.role === "founder") {
          const d = founderMap[p.id];
          tagline = d?.startup_name ? `${d.startup_name}${d.industry ? " · " + d.industry : ""}` : null;
          chips = [d?.stage && stageLabel(d.stage), ...(d?.skills_needed ?? [])].filter(Boolean) as string[];
          if (industry && d?.industry !== industry) return null;
          if (stage && d?.stage !== stage) return null;
          if (skill && !(d?.skills_needed ?? []).includes(skill)) return null;
        } else if (p.role === "professional") {
          const d = proMap[p.id];
          tagline = d?.experience_level ? `${cap(d.experience_level)} · ${d?.availability ? availabilityLabel(d.availability) : "Open to work"}` : null;
          chips = [...(d?.skills ?? []), ...(d?.industries ?? [])];
          if (industry && !(d?.industries ?? []).includes(industry)) return null;
          if (skill && !(d?.skills ?? []).includes(skill)) return null;
          if (stage) return null;
        } else if (p.role === "investor") {
          const d = invMap[p.id];
          const range = d?.investment_range_max ? `$${fmt(d.investment_range_min ?? 0)}–$${fmt(d.investment_range_max)}` : null;
          tagline = range ? `Check: ${range}` : null;
          chips = [...(d?.preferred_industries ?? []), ...((d?.preferred_stages ?? []).map(stageLabel))];
          if (industry && !(d?.preferred_industries ?? []).includes(industry)) return null;
          if (stage && !(d?.preferred_stages ?? []).includes(stage)) return null;
          if (skill) return null;
        }
        return { ...p, tagline, chips };
      })
      .filter(Boolean) as ProfileCardData[];
  }, [profiles, founderMap, proMap, invMap, industry, stage, skill]);

  const hasFilters = q || industry || stage || skill || location;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Discover</h1>
        <p className="mt-1 text-muted-foreground">Find founders, professionals and investors that fit what you're building.</p>
      </div>

      <Card className="mb-6">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name or bio..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Select value={industry || "all"} onValueChange={(v) => setIndustry(v === "all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any industry</SelectItem>
              {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stage || "all"} onValueChange={(v) => setStage(v === "all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any stage</SelectItem>
              {STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={skill || "all"} onValueChange={(v) => setSkill(v === "all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Skill" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any skill</SelectItem>
              {SKILLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setQ(""); setIndustry(""); setStage(""); setSkill(""); setLocation(""); }}>
            <X className="mr-1 size-4" /> Clear filters
          </Button>
        )}
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="mb-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="founder">Founders</TabsTrigger>
          <TabsTrigger value="professional">Professionals</TabsTrigger>
          <TabsTrigger value="investor">Investors</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-44 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center">
          <Search className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">No results match your filters.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <ProfileCard key={p.id} p={p} />)}
        </div>
      )}
    </main>
  );
}

function stageLabel(s: string) { return STAGES.find((x) => x.value === s)?.label ?? s; }
function availabilityLabel(s: string) { return s.replace("_", "-"); }
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}
