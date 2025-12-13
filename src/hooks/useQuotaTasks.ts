import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface QuotaTask {
  id: string;
  department_id: string;
  task_name: string;
  target: number;
  is_predefined: boolean;
  created_at: string;
  updated_at: string;
}

export const useQuotaTasks = (departmentId?: string) => {
  return useQuery({
    queryKey: departmentId ? ["quota_tasks", departmentId] : ["quota_tasks"],
    queryFn: async () => {
      let query = supabase
        .from("quota_tasks")
        .select("*")
        .order("task_name");
      
      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as QuotaTask[];
    },
  });
};

export const useAddQuotaTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTask: {
      department_id: string;
      task_name: string;
      target: number;
    }) => {
      const { data, error } = await supabase
        .from("quota_tasks")
        .insert([{ ...newTask, is_predefined: false }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quota_tasks"] });
      toast({
        title: "Success",
        description: "Quota task added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add quota task",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateQuotaTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: { id: string; target: number }) => {
      const { data, error } = await supabase
        .from("quota_tasks")
        .update({ target: task.target })
        .eq("id", task.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quota_tasks"] });
      toast({
        title: "Success",
        description: "Target updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update target",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteQuotaTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("quota_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quota_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast({
        title: "Success",
        description: "Quota task deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quota task",
        variant: "destructive",
      });
    },
  });
};
