import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

type ApprovalState =
  | { loading: true }
  | { loading: false; status: "approved" | "pending" | "rejected"; reason: string | null; isAdmin: boolean };

function AuthedLayout() {
  const { loading, user, role, signOut } = useAuth();
  const [state, setState] = useState<ApprovalState>({ loading: true });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("approval_status, rejection_reason, role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const isAdmin = data?.role === "admin";
        setState({
          loading: false,
          status: (data?.approval_status as any) ?? "pending",
          reason: data?.rejection_reason ?? null,
          isAdmin,
        });
      });
  }, [user, role]);

  if (loading || state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const blocked = !state.isAdmin && state.status !== "approved";

  if (blocked) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-screen max-w-lg items-center px-4 py-12">
          <Card className="w-full p-8 text-center">
            {state.status === "pending" ? (
              <>
                <Clock className="mx-auto size-12 text-primary" />
                <h1 className="mt-4 text-2xl font-bold">Your account is under review</h1>
                <p className="mt-2 text-muted-foreground">
                  Thanks for signing up. An admin is reviewing your application — we'll notify you by
                  email once your account is approved.
                </p>
              </>
            ) : (
              <>
                <XCircle className="mx-auto size-12 text-destructive" />
                <h1 className="mt-4 text-2xl font-bold">Your application was not approved</h1>
                {state.reason ? (
                  <p className="mt-3 rounded-lg bg-muted p-3 text-left text-sm">
                    <span className="font-medium">Reason: </span>
                    {state.reason}
                  </p>
                ) : (
                  <p className="mt-2 text-muted-foreground">
                    Unfortunately we're unable to approve your account at this time.
                  </p>
                )}
              </>
            )}
            <Button variant="outline" className="mt-6" onClick={signOut}>
              Sign out
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
    </div>
  );
}
