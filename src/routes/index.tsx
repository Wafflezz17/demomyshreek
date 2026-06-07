import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, PlusCircle, ShieldCheck, BadgeCheck, MessageSquare, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BRAND, DISCLAIMER } from "@/lib/myshareek";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${BRAND} — Where opportunities meet partners in the UAE & GCC` },
      { name: "description", content: "myShareek is a business networking platform connecting entrepreneurs and funding partners across the UAE and GCC. Discover opportunities, meet founders, start conversations." },
      { property: "og:title", content: `${BRAND} — Where opportunities meet partners` },
      { property: "og:description", content: "Discover growth and strategic partnership opportunities across the UAE and the GCC." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <section className="relative gradient-hero">
        <div className="container mx-auto grid gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-verified" /> Opportunity-led. Founder-powered.
            </div>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-balance md:text-6xl">
              Where business opportunities <span className="text-primary">meet the right partners.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              myShareek connects entrepreneurs with funding and strategic partners across the UAE and the GCC. Discover real opportunities, see the founders behind them, and start a conversation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/browse"><Compass className="mr-2 size-4" /> Explore opportunities</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth" search={{ mode: "signup" }}><PlusCircle className="mr-2 size-4" /> List an opportunity</Link>
              </Button>
            </div>
            <p className="mt-6 max-w-xl text-xs text-muted-foreground">{DISCLAIMER}</p>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-2">
            <Preview title="Regional grocery chain — expansion partner" tag="Growth" sub="Retail · UAE · AED 2M–10M" />
            <Preview title="HealthTech platform — funding partner" tag="Funding partner" sub="HealthTech · Riyadh · AED 500K–2M" className="sm:mt-8" verified />
            <Preview title="EdTech — GCC market entry partner" tag="Strategic" sub="EdTech · MENA-wide" />
            <Preview title="Cleantech rollout — capital + expertise" tag="Growth" sub="CleanTech · UAE · AED 10M+" className="sm:mt-8" verified />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">How myShareek works</h2>
          <p className="mt-3 text-muted-foreground">Three steps to your next business connection.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "List or discover", d: "Entrepreneurs publish growth and partnership opportunities. Funding partners discover them via filters and matched suggestions." },
            { n: "02", t: "See the founder behind it", d: "Every opportunity shows the founder — their background, expertise, and verification status. No anonymous listings." },
            { n: "03", t: "Request a connection", d: "Send a connection request with a short note. When accepted, the conversation continues securely on myShareek." },
          ].map((s) => (
            <Card key={s.n} className="p-6">
              <div className="text-xs font-bold text-primary">{s.n}</div>
              <h3 className="mt-2 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/40">
        <div className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-2">
          <Audience
            icon={<PlusCircle className="size-5" />}
            title="For Entrepreneurs"
            text="Publish a structured opportunity, get found by serious funding partners, and own your founder story."
            cta="List an opportunity"
          />
          <Audience
            icon={<Search className="size-5" />}
            title="For Funding Partners"
            text="Discover opportunities matched to your focus, see who's behind them, and connect with verified founders directly."
            cta="Browse opportunities"
            href="/browse"
          />
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Built around trust signals — not gatekeepers</h2>
          <p className="mt-4 text-muted-foreground">
            Open registration. Verified badges are earned, not assigned. Founders are visible. Opportunities are clearly stated. You decide who to engage.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-verified" /> Verified profiles</span>
            <span className="flex items-center gap-2"><MessageSquare className="size-4 text-primary" /> On-platform messaging</span>
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Reactive moderation</span>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function Preview({ title, tag, sub, className = "", verified = false }: { title: string; tag: string; sub: string; className?: string; verified?: boolean }) {
  return (
    <Card className={`p-4 shadow-card ${className}`}>
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary/8 px-2 py-0.5 text-xs font-semibold text-primary">{tag}</span>
        {verified && <BadgeCheck className="size-4 text-verified" />}
      </div>
      <div className="mt-3 text-sm font-semibold text-foreground">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </Card>
  );
}

function Audience({ icon, title, text, cta, href = "/auth?mode=signup" }: { icon: React.ReactNode; title: string; text: string; cta: string; href?: string }) {
  return (
    <Card className="p-8">
      <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">{icon}</div>
      <h3 className="mt-4 text-2xl font-bold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{text}</p>
      <Link to={href} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        {cta} <ArrowRight className="size-4" />
      </Link>
    </Card>
  );
}
