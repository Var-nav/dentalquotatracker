import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";
import { usePushNotifications } from "./usePushNotifications";

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
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendLocalNotification } = usePushNotifications();

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

  // Real-time subscription for procedures
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("procedures-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "procedures",
        },
        (payload) => {
          console.log("Real-time procedure update:", payload);

          // Update cache immediately
          if (payload.eventType === "INSERT") {
            queryClient.setQueryData<Procedure[]>(["procedures"], (old = []) => [
              payload.new as Procedure,
              ...old,
            ]);
          } else if (payload.eventType === "UPDATE") {
            queryClient.setQueryData<Procedure[]>(["procedures"], (old = []) =>
              old.map((proc) =>
                proc.id === payload.new.id ? (payload.new as Procedure) : proc
              )
            );

            // Show toast if status changed to verified
            if (
              payload.new.status === "verified" &&
              payload.old.status !== "verified" &&
              payload.new.student_id === user.id
            ) {
              toast({
                title: "Procedure Verified! ✅",
                description: "Your case has been approved by the supervisor.",
              });

              // Send push notification
              sendLocalNotification(
                "Procedure Verified! ✅",
                "Your case has been approved by the supervisor."
              );
            }
          } else if (payload.eventType === "DELETE") {
            queryClient.setQueryData<Procedure[]>(["procedures"], (old = []) =>
              old.filter((proc) => proc.id !== payload.old.id)
            );
          }

          // Also invalidate to refetch in background
          queryClient.invalidateQueries({ queryKey: ["procedures"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, toast, sendLocalNotification]);

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
