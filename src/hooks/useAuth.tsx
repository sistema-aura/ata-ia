import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  blocked_reason: string | null;
  subscription_status: string | null;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company_id: string | null;
}

interface FakeUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: FakeUser | null;
  session: null;
  loading: boolean;
  isAdmin: boolean;
  profile: Profile | null;
  company: Company | null;
  signOut: () => Promise<void>;
}

// App pública sem autenticação: utilizador "anónimo" sintético + empresa padrão.
const ANON_USER: FakeUser = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "publico@app.local",
};

const ANON_PROFILE: Profile = {
  id: ANON_USER.id,
  email: ANON_USER.email,
  full_name: "",
  avatar_url: null,
  company_id: null,
};

const AuthContext = createContext<AuthContextType>({
  user: ANON_USER,
  session: null,
  loading: true,
  isAdmin: true,
  profile: ANON_PROFILE,
  company: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        setCompany(data as Company);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: ANON_USER,
        session: null,
        loading,
        isAdmin: true,
        profile: { ...ANON_PROFILE, company_id: company?.id ?? null },
        company,
        signOut: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
