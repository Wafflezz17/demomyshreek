import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export function PublicFooter() {
  return (
    <footer className="border-t bg-secondary/40 mt-auto">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Where opportunities meet partners — across the UAE and the GCC.
          </p>
        </div>
        <FooterCol title="Platform" links={[
          { to: "/browse", label: "Explore opportunities" },
          { to: "/how-it-works", label: "How it works" },
          { to: "/about", label: "About" },
        ]} />
        <FooterCol title="Legal" links={[
          { to: "/terms", label: "Terms of Service" },
          { to: "/privacy", label: "Privacy Policy" },
          { to: "/disclaimer", label: "Disclaimer" },
        ]} />
        <FooterCol title="Get started" links={[
          { to: "/auth?mode=signup", label: "List an opportunity" },
          { to: "/auth?mode=signup", label: "Join as a funding partner" },
          { to: "/auth", label: "Sign in" },
        ]} />
      </div>
      <div className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} myShareek. All rights reserved.</span>
          <span>Introductions only — we never handle money.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="hover:text-foreground">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
