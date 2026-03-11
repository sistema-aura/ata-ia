import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const { data: { user: caller } } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: caller.id, _role: "admin" });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  const { action, userId, password } = await req.json();

  if (action === "reset_password" && userId && password) {
    const { error } = await supabaseAdmin.auth.admin.updateUser(userId, { password });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  if (action === "list_users") {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }
    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
    }));
    return new Response(JSON.stringify({ users }), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
});
