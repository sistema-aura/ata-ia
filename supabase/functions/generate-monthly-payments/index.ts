import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Get all companies with a monthly price > 0
    const { data: companies, error: compErr } = await supabase
      .from("companies")
      .select("id, name, monthly_price")
      .gt("monthly_price", 0);

    if (compErr) throw compErr;
    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ message: "No companies with pricing", month: currentMonth }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get existing payments for this month
    const { data: existing, error: existErr } = await supabase
      .from("payments")
      .select("company_id")
      .eq("reference_month", currentMonth);

    if (existErr) throw existErr;

    const existingIds = new Set((existing || []).map((p: any) => p.company_id));
    const toInsert = companies
      .filter((c: any) => !existingIds.has(c.id))
      .map((c: any) => ({
        company_id: c.id,
        amount: c.monthly_price,
        reference_month: currentMonth,
        status: "pending",
        notes: "Gerado automaticamente",
      }));

    if (toInsert.length === 0) {
      return new Response(JSON.stringify({ message: "All payments already exist", month: currentMonth }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error: insertErr } = await supabase.from("payments").insert(toInsert);
    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ message: `Created ${toInsert.length} payments`, month: currentMonth }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
