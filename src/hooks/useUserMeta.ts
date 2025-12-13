import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserMeta {
  role: "student" | "instructor" | null;
  batchName: string | null;
}

export const useUserMeta = () => {
  const { user } = useAuth();
  const [meta, setMeta] = useState<UserMeta>({ role: null, batchName: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMeta({ role: null, batchName: null });
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const { data: roleRow, error: roleError } = await (supabase as any)
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleError) throw roleError;

        const { data: userBatchRow, error: ubError } = await (supabase as any)
          .from("user_batches")
          .select("batch_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (ubError) throw ubError;

        let batchName: string | null = null;
        if (userBatchRow?.batch_id) {
          const { data: batchRow, error: batchError } = await (supabase as any)
            .from("batches")
            .select("name")
            .eq("id", userBatchRow.batch_id)
            .maybeSingle();

          if (batchError) throw batchError;
          batchName = batchRow?.name ?? null;
        }

        if (!cancelled) {
          setMeta({
            role: (roleRow?.role as "student" | "instructor" | null) ?? null,
            batchName,
          });
        }
      } catch (error) {
        console.error("Failed to load user meta", error);
        if (!cancelled) {
          setMeta({ role: null, batchName: null });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { meta, loading };
};
