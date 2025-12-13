import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProcedureType = "Restorations" | "Extractions" | "Root Canals";

export interface QuotaTarget {
  id: string;
  procedure_type: ProcedureType;
  target: number;
  updated_at?: string;
}

export const useQuotaTargets = () => {
  const queryClient = useQueryClient();

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ["quota-targets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quota_targets")
        .select("*");

      if (error) throw error;
      return data as QuotaTarget[];
    },
  });

  const updateTarget = useMutation({
    mutationFn: async ({
      procedure_type,
      target,
    }: {
      procedure_type: ProcedureType;
      target: number;
    }) => {
      const { data, error } = await supabase
        .from("quota_targets")
        .upsert(
          {
            procedure_type,
            target,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "procedure_type" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as QuotaTarget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quota-targets"] });
    },
  });

  return {
    targets,
    isLoading,
    updateTarget: updateTarget.mutateAsync,
  };
};
