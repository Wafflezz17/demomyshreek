import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { Disclaimer } from "@/components/Disclaimer";
import { BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [
    { title: `How it works · ${BRAND}` },
    { name: "description", content: "How myShareek connects entrepreneurs and funding partners — opportunity-led, founder-powered, introductions only." },
    { property: "og:title", content: `How it works · ${BRAND}` },
    { property: "og:description", content: "Opportunity-led, founder-powered. Introductions only." },
  ]}),
  component: () => (
    <StaticPage title="How myShareek works" subtitle="Opportunity-led. Founder-powered. Introductions only.">
      <h2>1. Entrepreneurs publish opportunities</h2>
      <p>Founders use a structured template to describe a growth opportunity, strategic partnership, expansion plan, or what they're seeking from a funding partner. Every opportunity goes live immediately.</p>
      <h2>2. Funding partners discover</h2>
      <p>Investors and strategic partners browse a card grid of opportunities, with filters for sector, stage, geography, and capital band. A matched "Fits Your Focus" strip surfaces opportunities aligned to their preferences.</p>
      <h2>3. The founder is always visible</h2>
      <p>Every opportunity prominently shows the founder behind it — their name, photo, background, industry expertise, and verification status. No anonymous listings.</p>
      <h2>4. Connect on a double opt-in</h2>
      <p>Send a connection request with a short intro note. Once accepted, you can message securely on myShareek. We never handle money, contracts, or negotiations.</p>
      <h2>5. Earn trust through completion and verification</h2>
      <p>Build profile completeness and optionally verify via LinkedIn or documents. Verified users get a prominent badge, higher search ranking, and higher daily limits.</p>
      <div className="mt-8 not-prose"><Disclaimer /></div>
    </StaticPage>
  ),
});
