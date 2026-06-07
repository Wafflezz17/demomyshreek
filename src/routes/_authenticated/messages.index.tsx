import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/RoleBadge";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({ meta: [{ title: "Messages · VentureHub" }] }),
  component: Inbox,
});

function Inbox() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, participant_a, participant_b, last_message_at")
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      if (!convs || convs.length === 0) { setConvos([]); setLoading(false); return; }
      const otherIds = convs.map((c) => (c.participant_a === user.id ? c.participant_b : c.participant_a));
      const [{ data: others }, { data: msgs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, role").in("id", otherIds),
        supabase.from("messages").select("conversation_id, content, sender_id, created_at, read_at").in("conversation_id", convs.map((c) => c.id)).order("created_at", { ascending: false }),
      ]);
      const lastByConv = new Map<string, any>();
      const unreadByConv = new Map<string, number>();
      (msgs ?? []).forEach((m: any) => {
        if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
        if (!m.read_at && m.sender_id !== user.id) unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1);
      });
      setConvos(convs.map((c) => {
        const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
        return { ...c, other: others?.find((o) => o.id === otherId), last: lastByConv.get(c.id), unread: unreadByConv.get(c.id) ?? 0 };
      }));
      setLoading(false);
    };
    load();
    const ch = supabase.channel("inbox").on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-display text-3xl font-bold">Messages</h1>
      {loading ? (
        <Card className="h-64 animate-pulse bg-muted/40" />
      ) : convos.length === 0 ? (
        <Card className="text-center">
          <MessageSquare className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">No conversations yet.</p>
          <Button className="mt-4" asChild><Link to="/discover">Find people to message</Link></Button>
        </Card>
      ) : (
        <Card className="divide-y">
          {convos.map((c) => (
            <Link
              key={c.id}
              to="/messages/$id"
              params={{ id: c.id }}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/40"
            >
              <Avatar className="size-11">
                {c.other?.avatar_url && <AvatarImage src={c.other.avatar_url} />}
                <AvatarFallback className="bg-primary text-primary-foreground">{(c.other?.full_name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{c.other?.full_name ?? "Someone"}</span>
                  {c.other?.role && <RoleBadge role={c.other.role} />}
                </div>
                <p className="truncate text-sm text-muted-foreground">{c.last?.content ?? "Say hi 👋"}</p>
              </div>
              {c.unread > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">{c.unread}</span>
              )}
            </Link>
          ))}
        </Card>
      )}
    </main>
  );
}
