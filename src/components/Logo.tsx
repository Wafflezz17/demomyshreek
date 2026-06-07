import { Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/myshareek";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
        mS
      </span>
      <span className="text-lg">{BRAND}</span>
    </Link>
  );
}
