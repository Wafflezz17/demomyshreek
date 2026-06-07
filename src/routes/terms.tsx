import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: `Terms of Service · ${BRAND}` },
    { name: "description", content: "myShareek terms of service." },
  ]}),
  component: () => (
    <StaticPage title="Terms of Service" subtitle="Last updated June 2026">
      <p>By using myShareek you agree to these terms. myShareek is an introductions platform; we are not a broker, dealer, advisor, or marketplace for securities, equity, or financial products.</p>
      <h2>Use of the platform</h2>
      <p>You agree to provide accurate information, to comply with applicable laws, and to interact respectfully with other users. We may suspend or remove accounts that violate these terms.</p>
      <h2>Content & opportunities</h2>
      <p>You are solely responsible for the opportunities you publish and the conversations you have. myShareek does not verify, endorse, or warrant any opportunity or user.</p>
      <h2>Not investment advice</h2>
      <p>Nothing on myShareek constitutes financial, legal, or investment advice. Always conduct your own due diligence and consult licensed professionals.</p>
      <h2>Liability</h2>
      <p>To the maximum extent permitted by law, myShareek and its operators are not liable for any loss arising from your use of the platform or interactions with other users.</p>
    </StaticPage>
  ),
});
