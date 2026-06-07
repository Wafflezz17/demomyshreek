import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { Disclaimer } from "@/components/Disclaimer";
import { BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({ meta: [
    { title: `Disclaimer · ${BRAND}` },
    { name: "description", content: "Important disclaimer about myShareek." },
  ]}),
  component: () => (
    <StaticPage title="Disclaimer">
      <div className="not-prose"><Disclaimer /></div>
      <h2>Not an investment platform</h2>
      <p>myShareek is not a securities exchange, broker-dealer, crowdfunding platform, or payment processor. We do not facilitate the buying or selling of shares, securities, tokens, or financial instruments.</p>
      <h2>No endorsement</h2>
      <p>Opportunities listed on myShareek are submitted by their owners. We do not independently verify financial claims, traction figures, or business statements. A "Verified" badge applies to identity verification — not to the merits of an opportunity.</p>
      <h2>Do your own due diligence</h2>
      <p>Before engaging with any user or opportunity, conduct your own research, request and verify documentation, and consult licensed legal and financial advisors as appropriate.</p>
    </StaticPage>
  ),
});
