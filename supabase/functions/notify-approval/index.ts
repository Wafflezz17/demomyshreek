// Notify a user that their account was approved or rejected.
// - Always writes an in-app notification row (via service role).
// - Attempts to send an email via Resend if RESEND_API_KEY is configured.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { user_id, decision, rejection_reason } = await req.json();
    if (!user_id || !["approved", "rejected"].includes(decision)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(token);
    if (!userData?.user) return new Response("Unauthorized", { status: 401, headers: cors });
    const { data: isAdminRow } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!isAdminRow) return new Response("Forbidden", { status: 403, headers: cors });

    // Fetch target user's email + name
    const { data: targetUser } = await admin.auth.admin.getUserById(user_id);
    const email = targetUser?.user?.email ?? null;
    const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user_id).maybeSingle();
    const name = profile?.full_name ?? "there";

    const approved = decision === "approved";
    const title = approved ? "Your myShareek account is approved" : "Update on your myShareek application";
    const body = approved
      ? `Hi ${name}, your myShareek account has been approved. You can now sign in and start using the platform.`
      : `Hi ${name}, unfortunately your myShareek application was not approved.${rejection_reason ? `\n\nReason: ${rejection_reason}` : ""}`;

    // In-app notification (best-effort)
    await admin.from("notifications").insert({
      user_id,
      type: approved ? "approval_approved" : "approval_rejected",
      title,
      body,
    }).then(() => null, () => null);

    // Email via Resend if available
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailed = false;
    if (resendKey && email) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: Deno.env.get("RESEND_FROM") ?? "myShareek <onboarding@resend.dev>",
            to: [email],
            subject: title,
            text: body,
          }),
        });
        emailed = res.ok;
      } catch {
        emailed = false;
      }
    }

    return new Response(JSON.stringify({ ok: true, emailed }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
