import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/RoleBadge";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  head: () => ({ meta: [{ title: "Conversation · VentureHub" }] }),
  component: Conversation,
});

function Conversation() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [other, setOther] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: conv, error } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
      if (error || !conv) { navigate({ to: "/messages" }); return; }
      const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
      const { data: o } = await supabase.from("profiles").select("id, full_name, avatar_url, role").eq("id", otherId).maybeSingle();
      setOther(o);
      const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
      setMessages(msgs ?? []);
      // mark unread as read
      await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", id).neq("sender_id", user.id).is("read_at", null);
    })();

    const channel = supabase
      .channel(`conv-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, (payload) => {
        setMessages((cur) => [...cur, payload.new]);
        if (payload.new.sender_id !== user.id) {
          supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", payload.new.id);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user, navigate]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: user.id, content: text.trim() });
    if (error) { setSending(false); return toast.error(error.message); }
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
    setText("");
    setSending(false);
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-6">
      <Card className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b p-4">
          <Button variant="ghost" size="icon" asChild><Link to="/messages"><ArrowLeft className="size-5" /></Link></Button>
          {other && (
            <Link to="/u/$id" params={{ id: other.id }} className="flex items-center gap-3 group">
              <Avatar className="size-10">
                {other.avatar_url && <AvatarImage src={other.avatar_url} />}
                <AvatarFallback className="bg-primary text-primary-foreground">{(other.full_name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold group-hover:text-primary">{other.full_name}</div>
                <RoleBadge role={other.role} />
              </div>
            </Link>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              No messages yet — start the conversation 👋
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="flex gap-2 border-t p-3">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." />
          <Button type="submit" disabled={sending || !text.trim()}><Send className="size-4" /></Button>
        </form>
      </Card>
    </main>
  );
}
