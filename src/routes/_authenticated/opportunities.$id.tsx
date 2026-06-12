import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Bookmark, MapPin, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Disclaimer } from "@/components/Disclaimer";
import { OPPORTUNITY_TYPES, OPPORTUNITY_STAGES, formatCapitalBand, BRAND } from "@/lib/myshareek";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/opportunities/$id")({
  head: () => ({ meta: [{ title: `Opportunity · ${BRAND}` }] }),
  component: OpportunityDetail,
});

function OpportunityDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { user } = useAuth();
  const [opp, setOpp] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [ownerEntrepreneur, setOwnerEntrepreneur] = useState<any>(null);
  const [sector, setSector] = useState<string>("");
  const [intro, setIntro] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: o } = await supabase.from("opportunities").select("*").eq("id", id).maybeSingle();
      if (!o) return;
      setOpp(o);
      supabase.rpc("recompute_profile_completeness", { _user_id: o.owner_id }).then(() => {});
      const { data: p } = await supabase.from("profiles").select("*").eq("id", o.owner_id).maybeSingle();
      setOwner(p);
      const { data: ep } = await supabase.from("entrepreneur_profiles").select("*").eq("user_id", o.owner_id).maybeSingle();
      setOwnerEntrepreneur(ep);
      if (o.sector_id) {
        const { data: s } = await supabase.from("sectors").select("name").eq("id", o.sector_id).maybeSingle();
        setSector(s?.name ?? "");
      }
      if (user) {
        const { data: sv } = await supabase.from("saved_items").select("id").eq("user_id", user.id).eq("item_type", "opportunity").eq("reference", id).maybeSingle();
        setSaved(!!sv);
        const { data: cn } = await supabase.from("connections").select("id").eq("requester_id", user.id).eq("opportunity_id", id).maybeSingle();
        setRequested(!!cn);
      }
      // log view
      supabase.from("events").insert({ user_id: user?.id ?? null, event_type: "opportunity_viewed", payload: { opportunity_id: id } });
      supabase.rpc("recompute_profile_completeness", { _user_id: o.owner_id }).then(() => {});
    })();
  }, [id, user]);

  if (!opp) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  const typeLabel = OPPORTUNITY_TYPES.find((t) => t.value === opp.opportunity_type)?.label;
  const stageLabel = OPPORTUNITY_STAGES.find((s) => s.value === opp.stage)?.label;
  const verified = owner?.verification_status === "verified";
  const initials = (owner?.full_name ?? "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  const isOwner = user?.id === opp.owner_id;

  async function toggleSave() {
    if (!user) return;
    if (saved) {
      await supabase.from("saved_items").delete().eq("user_id", user.id).eq("item_type", "opportunity").eq("reference", id);
      setSaved(false);
    } else {
      await supabase.from("saved_items").insert({ user_id: user.id, item_type: "opportunity", reference: id });
      setSaved(true);
    }
  }

  async function submitRequest() {
    if (!user || !owner) return;
    if (intro.trim().length < 10) return toast.error("Please add a short intro note (min 10 chars).");
    setSubmitting(true);
    const { error } = await supabase.from("connections").insert({
      requester_id: user.id,
      recipient_id: opp.owner_id,
      opportunity_id: id,
      intro_message: intro.trim(),
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message;
      if (msg.includes("CONNECTION_RATE_LIMIT")) return toast.error(msg.replace(/^.*CONNECTION_RATE_LIMIT:\s*/, ""));
      if (msg.includes("trust_tier")) return toast.error("Complete your profile to send connection requests.");
      return toast.error(msg);
    }
    toast.success("Connection request sent.");
    setRequested(true);
    supabase.from("events").insert({ user_id: user.id, event_type: "connection_requested", payload: { opportunity_id: id } });
  }

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <Link to="/discover" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to opportunities
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-semibold text-primary">{typeLabel}</span>
              {sector && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{sector}</span>}
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{stageLabel}</span>
              {verified && <span className="inline-flex items-center gap-1 rounded-full bg-verified/10 px-2 py-0.5 text-xs font-semibold text-verified"><BadgeCheck className="size-3.5" /> Verified</span>}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">{opp.title}</h1>
            <p className="mt-3 text-muted-foreground">{opp.summary}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-4" />{[opp.location_city, opp.location_country].filter(Boolean).join(", ") || "—"}</span>
              <span className="flex items-center gap-1"><Building2 className="size-4" />{formatCapitalBand(opp.capital_band_min ? Number(opp.capital_band_min) : null, opp.capital_band_max ? Number(opp.capital_band_max) : null)}</span>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold">The opportunity</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{opp.description}</p>
          </Card>

          {opp.highlights?.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold">Highlights</h2>
              <ul className="mt-3 space-y-2">
                {opp.highlights.map((h: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />{h}</li>
                ))}
              </ul>
            </Card>
          )}

          {owner && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold">The founder</h2>
              <div className="mt-4 flex items-start gap-4">
                <Avatar className="size-16">
                  {owner.avatar_url && <AvatarImage src={owner.avatar_url} alt={owner.full_name} />}
                  <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to="/u/$id" params={{ id: owner.id }} className="text-lg font-semibold hover:underline">{owner.full_name}</Link>
                    {verified && <BadgeCheck className="size-5 text-verified" />}
                  </div>
                  {owner.headline && <div className="mt-1 text-sm text-muted-foreground">{owner.headline}</div>}
                  {ownerEntrepreneur?.company_name && <div className="mt-1 text-sm">at <span className="font-medium">{ownerEntrepreneur.company_name}</span></div>}
                  {ownerEntrepreneur?.background_summary && <p className="mt-3 text-sm text-muted-foreground">{ownerEntrepreneur.background_summary}</p>}
                  {ownerEntrepreneur?.industry_expertise?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ownerEntrepreneur.industry_expertise.map((e: string) => (
                        <span key={e} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Disclaimer />
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            {isOwner ? (
              <Button asChild className="w-full"><Link to="/opportunities/$id/edit" params={{ id }}>Edit opportunity</Link></Button>
            ) : requested ? (
              <div className="rounded-md bg-verified/10 p-3 text-center text-sm font-medium text-verified">Connection requested</div>
            ) : (
              <>
                <h3 className="font-semibold">Request a connection</h3>
                <p className="mt-1 text-xs text-muted-foreground">Send a short intro. If accepted, you'll be able to message on myShareek.</p>
                <Textarea value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Hi — I'd love to learn more about this opportunity because..." rows={5} className="mt-3" maxLength={500} />
                <Button onClick={submitRequest} disabled={submitting} className="mt-3 w-full">{submitting ? "Sending..." : "Request connection"}</Button>
              </>
            )}
            <Button variant="outline" onClick={toggleSave} className="mt-2 w-full">
              <Bookmark className={`mr-2 size-4 ${saved ? "fill-current" : ""}`} /> {saved ? "Saved" : "Save"}
            </Button>
          </Card>
        </aside>
      </div>
    </main>
  );
}
