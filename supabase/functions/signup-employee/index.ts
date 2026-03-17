import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyCode, email, password, fullName } = await req.json();

    if (!companyCode || !email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "Código da empresa, nome, email e password são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "A password deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedCode = String(companyCode)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, name, is_active")
      .eq("slug", normalizedCode)
      .maybeSingle();

    if (companyError) {
      return new Response(
        JSON.stringify({ error: "Erro ao validar empresa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!company) {
      return new Response(
        JSON.stringify({ error: "Código da empresa inválido" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName.trim() },
    });

    if (createError) {
      const msg = createError.message.includes("already been registered")
        ? "Este email já está registado"
        : createError.message;

      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    await supabaseAdmin
      .from("profiles")
      .update({
        company_id: company.id,
        full_name: fullName.trim(),
      })
      .eq("id", userId);

    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "company_user" });

    return new Response(
      JSON.stringify({
        success: true,
        message: company.is_active
          ? "Conta de funcionário criada com sucesso"
          : "Conta criada e associada à empresa. O acesso ficará disponível quando a empresa estiver ativa.",
        companyName: company.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});