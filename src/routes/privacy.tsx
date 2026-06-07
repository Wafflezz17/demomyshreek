import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: `Privacy Policy · ${BRAND}` },
    { name: "description", content: "How myShareek handles your data." },
  ]}),
  component: () => (
    <StaticPage title="Privacy Policy" subtitle="Last updated June 2026">
      <p>We collect the information you provide when you register, build your profile, publish opportunities, send connection requests, or message other users. We use this information to operate and improve the platform.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details (name, email, role)</li>
        <li>Profile fields you choose to share (headline, bio, location, LinkedIn, photo)</li>
        <li>Opportunities you publish</li>
        <li>Connection requests and messages</li>
        <li>Verification evidence (if you submit it)</li>
      </ul>
      <h2>What we share</h2>
      <p>Profile and opportunity content is visible to other authenticated users (and partially to logged-out visitors on the public browse page). Investor private profile fields are gated by your visibility setting.</p>
      <h2>Your rights</h2>
      <p>You can update or delete your profile at any time from Settings. Contact us to request a full data export or deletion.</p>
    </StaticPage>
  ),
});
