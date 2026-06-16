import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, MessageCircle, ExternalLink, Building2, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/RoleBadge";
import { STAGES, EXPERIENCE_LEVELS, AVAILABILITY } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/u/$id")({
  head: () => ({ meta: [{ title: "Profile · myShareek" }] }),
  component: PublicProfile,
});

function PublicProfile() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("profiles").select("id, full_name, headline, bio, avatar_url, role, location, location_city, location_country, linkedin_url, verification_status, trust_tier, profile_completeness, is_founding_member, last_active_at, status, created_at, updated_at").eq("id", id).maybeSingle();
      setProfile(p);
      if (!p) return;
      const table = p.role === "founder" ? "founder_details" : p.role === "investor" ? "investor_details" : "professional_details";
      const { data: d } = await supabase.from(table).select("*").eq("user_id", id).maybeSingle();
      setDetails(d);
    })();
  }, [id]);

  async function message() {
    if (!user) return;
    const { data, error } = await supabase.rpc("get_or_create_conversation", { _other_user: id });
    if (error) return toast.error(error.message);
    navigate({ to: "/messages/$id", params: { id: data as string } });
  }

  if (!profile) return <div className="container mx-auto p-8">Loading...</div>;

  const initials = (profile.full_name ?? "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  const isSelf = user?.id === id;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Card className="overflow-hidden">
        <div className="h-32 gradient-primary" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <Avatar className="size-24 ring-4 ring-background">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary text-2xl text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              {isSelf ? (
                <Button variant="outline" asChild><Link to="/profile">Edit profile</Link></Button>
              ) : (
                <Button onClick={message}><MessageCircle className="mr-2 size-4" /> Message</Button>
              )}
            </div>
          </div>
          <div className="mt-4">
            <h1 className="font-display text-3xl font-bold">{profile.full_name ?? "Unnamed"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <RoleBadge role={profile.role} />
              {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {profile.location}</span>}
              
            </div>
            {profile.bio && <p className="mt-4 max-w-2xl text-foreground/90">{profile.bio}</p>}
          </div>
        </div>
      </Card>

      {details && (
        <Card className="mt-6">
          {profile.role === "founder" && <FounderView d={details} />}
          {profile.role === "professional" && <ProfessionalView d={details} />}
          {profile.role === "investor" && <InvestorView d={details} />}
        </Card>
      )}
    </main>
  );
}

function FounderView({ d }: { d: any }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{d.startup_name ?? "Stealth startup"}</h2>
      <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
        {d.industry && <Pill icon={<Building2 className="size-3" />}>{d.industry}</Pill>}
        {d.stage && <Pill>{STAGES.find((s) => s.value === d.stage)?.label}</Pill>}
        {d.team_size != null && <Pill icon={<Users className="size-3" />}>{d.team_size} on team</Pill>}
        {d.funding_required != null && <Pill icon={<DollarSign className="size-3" />}>Raising ${fmt(d.funding_required)}</Pill>}
        {d.funding_status && <Pill>{d.funding_status}</Pill>}
      </div>
      {d.startup_description && <p className="mt-5 whitespace-pre-line text-foreground/90">{d.startup_description}</p>}
      {(d.skills_needed?.length ?? 0) > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Looking for</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {d.skills_needed.map((s: string) => <Chip key={s}>{s}</Chip>)}
          </div>
        </div>
      )}
      {d.equity_offered && (
        <div className="mt-5 rounded-lg bg-gold/10 p-4 text-sm">
          <span className="font-semibold">Equity offered:</span> {d.equity_offered}
        </div>
      )}
    </div>
  );
}

function ProfessionalView({ d }: { d: any }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 text-sm">
        {d.experience_level && <Pill>{EXPERIENCE_LEVELS.find((x) => x.value === d.experience_level)?.label}</Pill>}
        {d.availability && <Pill>{AVAILABILITY.find((x) => x.value === d.availability)?.label}</Pill>}
      </div>
      {(d.skills?.length ?? 0) > 0 && (
        <Section title="Skills">{d.skills.map((s: string) => <Chip key={s}>{s}</Chip>)}</Section>
      )}
      {(d.industries?.length ?? 0) > 0 && (
        <Section title="Industries of interest">{d.industries.map((s: string) => <Chip key={s}>{s}</Chip>)}</Section>
      )}
      {(d.portfolio_links?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">Portfolio</h3>
          <ul className="mt-2 space-y-1">
            {d.portfolio_links.map((l: string) => (
              <li key={l}><a href={l} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="size-3.5" /> {l}</a></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InvestorView({ d }: { d: any }) {
  return (
    <div className="space-y-5">
      {d.investment_range_max != null && (
        <div className="text-lg font-display font-semibold">
          Check size: ${fmt(d.investment_range_min ?? 0)} – ${fmt(d.investment_range_max)}
        </div>
      )}
      {d.investment_interests && <p className="text-foreground/90">{d.investment_interests}</p>}
      {(d.preferred_industries?.length ?? 0) > 0 && (
        <Section title="Preferred industries">{d.preferred_industries.map((s: string) => <Chip key={s}>{s}</Chip>)}</Section>
      )}
      {(d.preferred_stages?.length ?? 0) > 0 && (
        <Section title="Preferred stages">{d.preferred_stages.map((s: string) => <Chip key={s}>{STAGES.find((x) => x.value === s)?.label ?? s}</Chip>)}</Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{children}</span>;
}
function Pill({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{icon} {children}</span>;
}
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}
