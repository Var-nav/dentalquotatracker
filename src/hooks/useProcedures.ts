import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProcedureType = "Restorations" | "Extractions" | "Root Canals";

export interface Procedure {
  id: string;
  patient_name: string;
  procedure_type: ProcedureType;
  procedure_date: string;
  supervisor_name: string;
  created_at?: string;
}

export const useProcedures = () => {
  const queryClient = useQueryClient();

  const { data: procedures = [], isLoading } = useQuery({
    queryKey: ["procedures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedures")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Procedure[];
    },
  });

  const addProcedure = useMutation({
    mutationFn: async (
      newProcedure: Omit<Procedure, "id" | "created_at">
    ) => {
      const { data, error } = await supabase
        .from("procedures")
        .insert([newProcedure])
        .select()
        .single();

      if (error) throw error;
      return data as Procedure;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
    },
  });

  return {
    procedures,
    isLoading,
    addProcedure: addProcedure.mutateAsync,
  };
};
