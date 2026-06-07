import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Compass, LayoutDashboard, MessageSquare, LogOut, User as UserIcon, Bell, PlusCircle, Bookmark, Users, Settings as SettingsIcon, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";
import { toDisplayRole, ROLE_LABEL, type DbRole } from "@/lib/myshareek";

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [unread, setUnread] = useState(0);
  const [name, setName] = useState<string>("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.full_name ?? "");
        setAvatar(data?.avatar_url ?? null);
      });
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      setIsAdmin(!!data?.some((r) => r.role === "admin"));
    });

    const load = async () => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .is("read_at", null)
        .neq("sender_id", user.id);
      setUnread(count ?? 0);
    };
    load();
    const channel = supabase
      .channel("nav-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const initials = (name || user?.email || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const displayRole = toDisplayRole(role as DbRole);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Logo />

        {user ? (
          <>
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink to="/dashboard" pathname={pathname} icon={<LayoutDashboard className="size-4" />}>Dashboard</NavLink>
              <NavLink to="/discover" pathname={pathname} icon={<Compass className="size-4" />}>Opportunities</NavLink>
              <NavLink to="/connections" pathname={pathname} icon={<Users className="size-4" />}>Connections</NavLink>
              <NavLink to="/messages" pathname={pathname} icon={<MessageSquare className="size-4" />}>
                Messages
                {unread > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-verified px-1.5 text-xs font-semibold text-verified-foreground">
                    {unread}
                  </span>
                )}
              </NavLink>
              <NavLink to="/saved" pathname={pathname} icon={<Bookmark className="size-4" />}>Saved</NavLink>
            </nav>

            <div className="flex items-center gap-2">
              {displayRole === "entrepreneur" && (
                <Button size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/opportunities/new"><PlusCircle className="mr-1.5 size-4" /> List opportunity</Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild>
                <Link to="/notifications"><Bell className="size-5" /></Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Avatar className="size-9">
                      {avatar && <AvatarImage src={avatar} alt={name} />}
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="font-semibold">{name || user.email}</div>
                    <div className="text-xs text-muted-foreground">{ROLE_LABEL[(role as DbRole) ?? "professional"]}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    <UserIcon className="mr-2 size-4" /> My profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                    <LayoutDashboard className="mr-2 size-4" /> Dashboard
                  </DropdownMenuItem>
                  {displayRole === "investor" && (
                    <DropdownMenuItem onClick={() => navigate({ to: "/focus" })}>
                      <Compass className="mr-2 size-4" /> My focus
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                    <SettingsIcon className="mr-2 size-4" /> Settings
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                      <Shield className="mr-2 size-4" /> Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                    <LogOut className="mr-2 size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/browse" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline">Explore</Link>
            <Link to="/how-it-works" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline">How it works</Link>
            <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
            <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ to, icon, children, pathname }: { to: string; icon: React.ReactNode; children: React.ReactNode; pathname: string }) {
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
