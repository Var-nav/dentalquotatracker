import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProcedureType = "Restorations" | "Extractions" | "Root Canals";

export interface Procedure {
  id: string;
  patient_name?: string | null;
  procedure_type: ProcedureType;
  procedure_date: string;
  supervisor_name: string;
  created_at?: string;
  department_id?: string | null;
  quota_task_id?: string | null;
  status?: string | null;
  student_id?: string | null;
  patient_op_number?: string | null;
  rejection_reason?: string | null;
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

  const updateProcedure = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Procedure, "id" | "created_at">>;
    }) => {
      const { data, error } = await supabase
        .from("procedures")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Procedure;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
    },
  });

  const deleteProcedure = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("procedures")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
    },
  });

  return {
    procedures,
    isLoading,
    addProcedure: addProcedure.mutateAsync,
    updateProcedure: updateProcedure.mutateAsync,
    deleteProcedure: deleteProcedure.mutateAsync,
  };
};
