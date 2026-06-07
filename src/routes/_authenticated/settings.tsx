import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/myshareek";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: `Settings · ${BRAND}` }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const [vstatus, setVstatus] = useState<string>("none");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("verification_status").eq("id", user.id).maybeSingle().then(({ data }) => setVstatus(data?.verification_status ?? "none"));
  }, [user]);

  async function requestVerification() {
    if (!user) return;
    const { error } = await supabase.from("verifications").insert({ user_id: user.id, method: "linkedin", decision: "pending" });
    if (error) return toast.error(error.message);
    await supabase.from("profiles").update({ verification_status: "pending" }).eq("id", user.id);
    setVstatus("pending");
    toast.success("Verification submitted. An admin will review it shortly.");
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card className="mt-6 p-6">
        <h2 className="font-semibold">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        <Button variant="outline" className="mt-4" onClick={() => signOut()}>Sign out</Button>
      </Card>
      <Card className="mt-4 p-6">
        <h2 className="font-semibold">Verification</h2>
        <p className="mt-1 text-sm text-muted-foreground">Status: <span className="capitalize font-medium text-foreground">{vstatus}</span></p>
        {vstatus === "none" && <Button className="mt-4" onClick={requestVerification}>Request verification</Button>}
        {vstatus === "pending" && <p className="mt-2 text-sm text-muted-foreground">An admin will review your verification soon.</p>}
      </Card>
    </main>
  );
}
