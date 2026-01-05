import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BatchStat {
  batch: string;
  total: number;
}

export const useBatchStats = () => {
  return useQuery({
    queryKey: ["batch-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_batch_comparison_stats");

      if (error) throw error;

      const batchStats = Array.isArray(data) ? (data as any[]).map((item: any) => ({
        batch: item.batch,
        total: item.total,
      })) : [];
      
      return batchStats as BatchStat[];
    },
  });
};
