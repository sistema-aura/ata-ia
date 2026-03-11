import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, email, password, fullName } = await req.json();

    if (!companyName || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Nome da empresa, email e password são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "A password deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate slug from company name
    const slug = companyName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists
    const { data: existingCompany } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingCompany) {
      return new Response(
        JSON.stringify({ error: "Já existe uma empresa com este nome registada" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Create the company (inactive by default - pending payment)
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: companyName.trim(),
        slug,
        is_active: false,
        subscription_status: "pending",
      })
      .select()
      .single();

    if (companyError) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar empresa: " + companyError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create the user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || companyName },
    });

    if (createError) {
      // Rollback company creation
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      
      const msg = createError.message.includes("already been registered")
        ? "Este email já está registado"
        : createError.message;
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // 3. Update profile with company_id and name
    await supabaseAdmin
      .from("profiles")
      .update({ 
        company_id: company.id, 
        full_name: fullName || companyName 
      })
      .eq("id", userId);

    // 4. Assign company_user role
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "company_user" });

    return new Response(
      JSON.stringify({ success: true, message: "Conta criada com sucesso" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
