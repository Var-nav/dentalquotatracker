import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface BatchStats {
  department: string;
  batch_avg: number;
}

interface DepartmentCount {
  department: string;
  myCount: number;
  batchAvg: number;
}

export const useBatchComparison = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["batch-comparison", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No user");

      // 1. Try to get user's batch
      const { data: userBatch, error: batchError } = await supabase
        .from("user_batches")
        .select("batch_id, batches(name)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (batchError) throw batchError;

      let batchName: string | undefined = (userBatch as any)?.batches?.name;

      // If user is not in a batch yet, fall back to the first batch that has data
      if (!batchName) {
        const { data: overallStats, error: overallError } = await supabase.rpc(
          "get_batch_comparison_stats"
        );
        if (overallError) throw overallError;

        const overallArray = Array.isArray(overallStats)
          ? (overallStats as any[])
          : [];
        batchName = overallArray[0]?.batch as string | undefined;

        if (!batchName) return [];
      }

      // 2. Get batch average stats via RPC for the selected batch
      const { data: batchStats, error: statsError } = await supabase.rpc(
        "get_student_vs_batch_stats",
        { student_batch: batchName }
      );

      if (statsError) throw statsError;

      // 3. Get user's own procedure counts per department
      const { data: userProcedures, error: procError } = await supabase
        .from("procedures")
        .select("department_id, departments(name)")
        .eq("student_id", user.id)
        .eq("status", "verified");

      if (procError) throw procError;

      // Count user's procedures by department
      const userCounts: Record<string, number> = {};
      userProcedures?.forEach((proc) => {
        const deptName = (proc.departments as any)?.name;
        if (deptName) {
          userCounts[deptName] = (userCounts[deptName] || 0) + 1;
        }
      });

      // 4. Combine the data
      const batchStatsArray = Array.isArray(batchStats)
        ? (batchStats as any[])
        : [];
      const result: DepartmentCount[] = batchStatsArray.map((stat: any) => ({
        department: stat.department,
        myCount: userCounts[stat.department] || 0,
        batchAvg: stat.batch_avg,
      }));

      return result;
    },
    enabled: !!user,
  });
};
