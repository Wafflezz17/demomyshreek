import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/RoleBadge";

export interface ProfileCardData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  role: string;
  tagline?: string | null;
  chips?: string[];
}

export function ProfileCard({ p }: { p: ProfileCardData }) {
  const initials = (p.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link to="/u/$id" params={{ id: p.id }} className="block group">
      <Card className="h-full transition-all hover:shadow-elegant hover:-translate-y-0.5 hover:border-primary/30">
        <div className="flex items-start gap-4">
          <Avatar className="size-14">
            {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.full_name ?? ""} />}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display text-base font-semibold group-hover:text-primary">
                {p.full_name ?? "Unnamed"}
              </h3>
            </div>
            <RoleBadge role={p.role} className="mt-1" />
            {p.location && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {p.location}
              </div>
            )}
          </div>
        </div>
        {p.tagline && <p className="mt-3 line-clamp-2 text-sm font-medium text-foreground/90">{p.tagline}</p>}
        {p.bio && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>}
        {p.chips && p.chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.chips.slice(0, 4).map((c) => (
              <span key={c} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{c}</span>
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}
