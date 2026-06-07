import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: `About · ${BRAND}` },
    { name: "description", content: "myShareek is a business networking platform for the UAE and GCC, connecting entrepreneurs with funding and strategic partners." },
    { property: "og:title", content: `About · ${BRAND}` },
    { property: "og:description", content: "Built for entrepreneurs and funding partners across the UAE and GCC." },
  ]}),
  component: () => (
    <StaticPage title={`About ${BRAND}`} subtitle="A trusted home for business opportunities in the UAE and the GCC.">
      <p>myShareek is a business networking platform designed for the UAE and GCC market. We connect entrepreneurs publishing growth and partnership opportunities with funding partners and strategic partners who can help them scale.</p>
      <p>We are not an investment platform. We do not handle money, equity, securities, or contracts. We are an introduction engine — a structured, trusted way for the right people to find each other and start a real conversation.</p>
      <h2>What makes us different</h2>
      <ul>
        <li><strong>Opportunity-led.</strong> Users discover opportunities first — never a social feed.</li>
        <li><strong>Founder-powered.</strong> Every opportunity prominently features the human behind it.</li>
        <li><strong>Open registration.</strong> No admin approval queue. Trust is earned through profile completion and verification.</li>
        <li><strong>Calm, action-led design.</strong> Filters and card grids — no likes, follows, or timelines.</li>
      </ul>
    </StaticPage>
  ),
});
