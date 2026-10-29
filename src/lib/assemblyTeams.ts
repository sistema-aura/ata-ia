import { supabase } from "@/integrations/supabase/client";

export async function setAssemblyTeams(id: string, noTeams: boolean) {
  const { error } = await supabase.from("assembleias").update({ no_teams: noTeams }).eq("id", id);
  if (error) throw error;
  return noTeams;
}