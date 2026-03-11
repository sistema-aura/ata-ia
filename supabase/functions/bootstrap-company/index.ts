import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Create company
  const { data: company, error: companyError } = await supabaseAdmin
    .from("companies")
    .insert({
      name: "Condominio Dinamico UNIPESSOAL, LDA",
      slug: "condominio-dinamico",
      is_active: true,
      subscription_status: "active",
    })
    .select()
    .single();

  if (companyError) {
    return new Response(JSON.stringify({ error: companyError.message }), { status: 400 });
  }

  // 2. Create user
  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: "geral.dinamico@gmail.com",
    password: "Dinamico2026",
    email_confirm: true,
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400 });
  }

  const userId = userData.user.id;

  // 3. Assign company to profile
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ company_id: company.id, full_name: "Condominio Dinamico" })
    .eq("id", userId);

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), { status: 400 });
  }

  // 4. Assign company_user role
  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: userId, role: "company_user" });

  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true, companyId: company.id, userId }), { status: 200 });
});
