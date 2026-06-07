import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Rocket, Briefcase, TrendingUp, Search, MessageSquare, Sparkles, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VentureHub — Where founders, talent and investors meet" },
      { name: "description", content: "Find your co-founder, your next role, or your next investment. VentureHub connects entrepreneurs, professionals and investors." },
      { property: "og:title", content: "VentureHub" },
      { property: "og:description", content: "Where founders, talent and investors meet." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container mx-auto grid gap-12 px-4 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="size-3.5 text-gold" /> Trusted by builders, talent & capital
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance md:text-6xl">
              Where the next great <span className="text-primary">startups</span> are built — together.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              VentureHub helps entrepreneurs find co-founders and skilled talent, and connects them with investors looking to back the next big thing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Join VentureHub <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-primary" /> Verified profiles</div>
              <div className="flex items-center gap-1.5"><MessageSquare className="size-4 text-primary" /> Direct messaging</div>
              <div className="flex items-center gap-1.5"><Search className="size-4 text-primary" /> Smart discovery</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl gradient-primary opacity-10 blur-3xl" />
            <div className="relative grid gap-4 sm:grid-cols-2">
              <FloatCard role="Founder" title="Looking for a CTO" sub="AI · MVP stage · Berlin" tone="primary" />
              <FloatCard role="Investor" title="Pre-seed · $50–250k" sub="Climate · Fintech · SaaS" tone="gold" className="sm:mt-8" />
              <FloatCard role="Professional" title="Senior Product Designer" sub="Open to join · Remote" tone="accent" />
              <FloatCard role="Founder" title="Building a fintech wallet" sub="Looking for: Backend, Growth" tone="primary" className="sm:mt-8" />
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCE CARDS */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Built for the people who build the future</h2>
          <p className="mt-3 text-muted-foreground">Three sides of the table. One place to meet.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <AudienceCard
            icon={<Rocket className="size-5" />}
            title="Founders"
            text="Tell the world what you're building. Find co-founders with the skills you're missing, and the investors that get your space."
            cta="I'm a founder"
          />
          <AudienceCard
            icon={<Briefcase className="size-5" />}
            title="Professionals"
            text="Join early-stage teams as a co-founder, employee or advisor. Showcase your skills, portfolio and availability."
            cta="I'm looking to join"
          />
          <AudienceCard
            icon={<TrendingUp className="size-5" />}
            title="Investors"
            text="Discover promising founders matched to your thesis, stage and check size. Connect directly — no warm intro needed."
            cta="I invest"
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t bg-secondary/40">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">Get from signup to first real conversation in minutes.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Create your profile", d: "Pick your role and tell us what you bring — and what you're looking for." },
              { n: "02", t: "Discover the right people", d: "Filter by industry, stage, skills and location. Browse curated suggestions." },
              { n: "03", t: "Start a conversation", d: "Direct message anyone on the platform. No gatekeepers, no warm intro tax." },
            ].map((s) => (
              <Card key={s.n}>
                <div className="font-display text-sm font-bold text-primary">{s.n}</div>
                <h3 className="mt-2 font-display text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="overflow-hidden border-0 gradient-primary p-10 text-primary-foreground md:p-14">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to build something that matters?</h2>
              <p className="mt-3 max-w-2xl text-primary-foreground/85">Join thousands of founders, operators and investors. Free to get started.</p>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Get started — it's free <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </div>
        </Card>
      </section>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <span className="inline-block size-5 rounded gradient-primary" />
            <span className="font-display font-semibold text-foreground">VentureHub</span>
            <span>· © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-foreground">About</Link>
            <Link to="/" className="hover:text-foreground">Privacy</Link>
            <Link to="/" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AudienceCard({ icon, title, text, cta }: { icon: React.ReactNode; title: string; text: string; cta: string }) {
  return (
    <Card className="group flex h-full flex-col transition-all hover:shadow-elegant hover:-translate-y-1">
      <div className="inline-flex size-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground">{icon}</div>
      <h3 className="mt-5 font-display text-2xl font-bold">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{text}</p>
      <Link
        to="/auth"
        search={{ mode: "signup" }}
        className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all"
      >
        {cta} <ArrowRight className="size-4" />
      </Link>
    </Card>
  );
}

function FloatCard({ role, title, sub, tone, className = "" }: { role: string; title: string; sub: string; tone: "primary" | "gold" | "accent"; className?: string }) {
  const toneClass =
    tone === "primary" ? "border-primary/20 bg-card" :
    tone === "gold" ? "border-gold/30 bg-card" :
    "border-border bg-card";
  const chipClass =
    tone === "primary" ? "bg-primary/10 text-primary" :
    tone === "gold" ? "bg-gold/15 text-gold-foreground" :
    "bg-accent text-accent-foreground";
  return (
    <Card className={`shadow-card ${toneClass} ${className}`}>
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${chipClass}`}>{role}</span>
      <div className="mt-3 font-display text-base font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </Card>
  );
}
