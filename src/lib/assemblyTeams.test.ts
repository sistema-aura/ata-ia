import { describe, expect, it, vi } from "vitest";
import { setAssemblyTeams } from "./assemblyTeams";

const { update, eq } = vi.hoisted(() => ({ update: vi.fn(), eq: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ update }) },
}));

describe("assembly Teams marking", () => {
  it.each([true, false])("persists the Teams marking as %s", async (marked) => {
    update.mockReturnValue({ eq });
    eq.mockResolvedValue({ error: null });
    expect(await setAssemblyTeams("assembly-020", marked)).toBe(marked);
    expect(update).toHaveBeenLastCalledWith({ no_teams: marked });
    expect(eq).toHaveBeenLastCalledWith("id", "assembly-020");
  });
  it("does not accept a failed save", async () => {
    update.mockReturnValue({ eq });
    eq.mockResolvedValue({ error: new Error("Save failed") });
    await expect(setAssemblyTeams("assembly-020", true)).rejects.toThrow("Save failed");
  });
});