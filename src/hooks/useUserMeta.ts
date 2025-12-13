import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserMeta {
  role: "student" | "instructor" | null;
  batchName: string | null;
  yearOfStudy: string | null;
  academicYear: string | null;
  intakeLabel: string | null;
}

export const useUserMeta = () => {
  const { user } = useAuth();
  const [meta, setMeta] = useState<UserMeta>({ 
    role: null, 
    batchName: null,
    yearOfStudy: null,
    academicYear: null,
    intakeLabel: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMeta({ role: null, batchName: null, yearOfStudy: null, academicYear: null, intakeLabel: null });
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
        let yearOfStudy: string | null = null;
        let academicYear: string | null = null;
        let intakeLabel: string | null = null;

        if (userBatchRow?.batch_id) {
          const { data: batchRow, error: batchError } = await (supabase as any)
            .from("batches")
            .select("name, year_of_study, academic_year, intake_label")
            .eq("id", userBatchRow.batch_id)
            .maybeSingle();

          if (batchError) throw batchError;
          batchName = batchRow?.name ?? null;
          yearOfStudy = (batchRow as any)?.year_of_study ?? null;
          academicYear = (batchRow as any)?.academic_year ?? null;
          intakeLabel = (batchRow as any)?.intake_label ?? null;
        }

        if (!cancelled) {
          setMeta({
            role: (roleRow?.role as "student" | "instructor" | null) ?? null,
            batchName,
            yearOfStudy,
            academicYear,
            intakeLabel,
          });
        }
      } catch (error) {
        console.error("Failed to load user meta", error);
        if (!cancelled) {
          setMeta({ role: null, batchName: null, yearOfStudy: null, academicYear: null, intakeLabel: null });
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
