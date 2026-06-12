import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, Users, Sparkles, Rocket, Briefcase, TrendingUp, ArrowRight, CheckCircle2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProfileCard, type ProfileCardData } from "@/components/ProfileCard";
import { RoleBadge } from "@/components/RoleBadge";
import { rankOpportunities, type MatchResult } from "@/lib/matching";
import { formatCapitalBand } from "@/lib/myshareek";

type MatchedOpp = {
  id: string;
  title: string;
  summary: string;
  sector_id: string | null;
  stage: string | null;
  location_country: string | null;
  capital_band_min: number | null;
  capital_band_max: number | null;
  match: MatchResult;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · myShareek" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<ProfileCardData[]>([]);
  const [recentConvos, setRecentConvos] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [topMatches, setTopMatches] = useState<MatchedOpp[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(p);
      if (p?.role === "founder") {
        const { data } = await supabase.from("founder_details").select("*").eq("user_id", user.id).maybeSingle();
        setDetails(data);
      } else if (p?.role === "investor") {
        const { data } = await supabase.from("investor_details").select("*").eq("user_id", user.id).maybeSingle();
        setDetails(data);
        // Compute "Fits Your Focus" matches
        const [{ data: inv }, { data: opps }, { data: sectorRows }] = await Promise.all([
          supabase.from("investor_profiles").select("preferred_sectors, preferred_stages, ticket_min, ticket_max, geographies").eq("user_id", user.id).maybeSingle(),
          supabase.from("opportunities").select("id, title, summary, sector_id, stage, location_country, capital_band_min, capital_band_max, created_at").eq("status", "live").order("created_at", { ascending: false }).limit(80),
          supabase.from("sectors").select("id, name"),
        ]);
        if (inv && opps) {
          const sectorNameById = Object.fromEntries((sectorRows ?? []).map((s: any) => [s.id, s.name]));
          const ranked = rankOpportunities(opps as any, inv as any, sectorNameById)
            .filter((o) => o.match.score > 0)
            .slice(0, 5);
          setTopMatches(ranked as MatchedOpp[]);
        }
      } else {
        const { data } = await supabase.from("professional_details").select("*").eq("user_id", user.id).maybeSingle();
        setDetails(data);
      }

      // suggestions: complementary roles
      const targetRole: ("founder" | "professional" | "investor")[] = p?.role === "founder" ? ["professional", "investor"] : p?.role === "investor" ? ["founder"] : ["founder"];
      const { data: sugg } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location, bio, role")
        .in("role", targetRole)
        .neq("id", user.id)
        .limit(6);
      setSuggestions((sugg as ProfileCardData[]) ?? []);

      // recent conversations
      const { data: convos } = await supabase
        .from("conversations")
        .select("id, participant_a, participant_b, last_message_at")
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order("last_message_at", { ascending: false })
        .limit(4);
      if (convos && convos.length > 0) {
        const otherIds = convos.map((c) => (c.participant_a === user.id ? c.participant_b : c.participant_a));
        const { data: others } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role")
          .in("id", otherIds);
        const merged = convos.map((c) => {
          const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
          return { ...c, other: others?.find((o) => o.id === otherId) };
        });
        setRecentConvos(merged);
      }

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .is("read_at", null)
        .neq("sender_id", user.id);
      setUnreadCount(count ?? 0);
    })();
  }, [user]);

  const completion = computeCompletion(profile, details);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="font-display text-3xl font-bold">{profile?.full_name ?? "there"} 👋</h1>
          {role && <div className="mt-2"><RoleBadge role={role} /></div>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/profile">Edit profile</Link></Button>
          <Button asChild><Link to="/discover">Discover people <ArrowRight className="ml-1 size-4" /></Link></Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stats column */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Profile strength</h3>
              <span className="text-2xl font-bold text-primary">{completion.percent}%</span>
            </div>
            <Progress value={completion.percent} className="mt-3" />
            {completion.missing.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm">
                {completion.missing.slice(0, 4).map((m) => (
                  <li key={m} className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-muted-foreground" /> {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-sm text-primary">
                <CheckCircle2 className="size-4" /> Your profile looks great.
              </p>
            )}
            <Button variant="outline" className="mt-5 w-full" asChild>
              <Link to="/profile">Complete profile</Link>
            </Button>
          </Card>

          <Card>
            <h3 className="font-display text-lg font-semibold">Quick stats</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat icon={<MessageSquare className="size-4" />} label="Unread" value={unreadCount} />
              <Stat icon={<Users className="size-4" />} label="Conversations" value={recentConvos.length} />
            </div>
          </Card>
        </div>

        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent messages */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Recent messages</h3>
              <Link to="/messages" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            {recentConvos.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <MessageSquare className="mx-auto size-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No conversations yet. Find someone to connect with.</p>
                <Button className="mt-4" asChild><Link to="/discover">Discover</Link></Button>
              </div>
            ) : (
              <ul className="divide-y">
                {recentConvos.map((c) => (
                  <li key={c.id}>
                    <Link
                      to="/messages/$id"
                      params={{ id: c.id }}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-accent/40 -mx-2 px-2 rounded-md"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                          {(c.other?.full_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{c.other?.full_name ?? "Someone"}</div>
                          {c.other?.role && <RoleBadge role={c.other.role} />}
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Suggestions */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-gold" /> Suggested for you
              </h3>
              <Link to="/discover" className="text-sm font-medium text-primary hover:underline">See more</Link>
            </div>
            {suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suggestions yet — check back soon.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {suggestions.slice(0, 4).map((p) => (
                  <ProfileCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </Card>

          {/* Role-specific CTA */}
          <RoleCallout role={role} />
        </div>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-secondary/40 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function RoleCallout({ role }: { role: string | null }) {
  const map = {
    founder: { icon: <Rocket className="size-5" />, title: "Showcase your startup", text: "Founders with complete startup details get 3x more profile views.", cta: "Edit my startup" },
    professional: { icon: <Briefcase className="size-5" />, title: "Be discoverable", text: "Add your skills, portfolio and availability — founders are searching now.", cta: "Update my skills" },
    investor: { icon: <TrendingUp className="size-5" />, title: "Sharpen your thesis", text: "Tell founders what stage, industries and check size you focus on.", cta: "Update investment focus" },
  } as const;
  const m = role && role in map ? map[role as keyof typeof map] : map.professional;
  return (
    <Card className="gradient-primary text-primary-foreground">
      <div className="flex items-start gap-4">
        <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">{m.icon}</div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold">{m.title}</h3>
          <p className="mt-1 text-sm text-primary-foreground/85">{m.text}</p>
        </div>
        <Button variant="secondary" asChild><Link to="/profile">{m.cta}</Link></Button>
      </div>
    </Card>
  );
}

function computeCompletion(profile: any, details: any) {
  if (!profile) return { percent: 0, missing: [] as string[] };
  const checks: Array<[string, boolean]> = [
    ["Add a bio", !!profile.bio],
    ["Set your location", !!profile.location],
    ["Add a profile picture", !!profile.avatar_url],
  ];
  if (profile.role === "founder") {
    checks.push(["Add startup name", !!details?.startup_name]);
    checks.push(["Describe your startup", !!details?.startup_description]);
    checks.push(["Pick an industry & stage", !!details?.industry && !!details?.stage]);
    checks.push(["List skills you need", (details?.skills_needed?.length ?? 0) > 0]);
  } else if (profile.role === "investor") {
    checks.push(["Set preferred industries", (details?.preferred_industries?.length ?? 0) > 0]);
    checks.push(["Set investment range", !!details?.investment_range_max]);
    checks.push(["Pick preferred stages", (details?.preferred_stages?.length ?? 0) > 0]);
  } else {
    checks.push(["Add your skills", (details?.skills?.length ?? 0) > 0]);
    checks.push(["Set experience level", !!details?.experience_level]);
    checks.push(["Set availability", !!details?.availability]);
  }
  const done = checks.filter(([, v]) => v).length;
  const percent = Math.round((done / checks.length) * 100);
  return { percent, missing: checks.filter(([, v]) => !v).map(([k]) => k) };
}
