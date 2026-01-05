import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export interface UserStats {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_log_date: string | null;
  total_procedures: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export const useGamification = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userStats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as UserStats | null;
    },
    enabled: !!user,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["user-badges", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          *,
          badge:badges(*)
        `)
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!user,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Badge[];
    },
  });

  // Real-time subscription for stats and badges
  useEffect(() => {
    if (!user) return;

    const statsChannel = supabase
      .channel("user-stats-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_stats",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-stats", user.id] });
        }
      )
      .subscribe();

    const badgesChannel = supabase
      .channel("user-badges-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-badges", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statsChannel);
      supabase.removeChannel(badgesChannel);
    };
  }, [user, queryClient]);

  return {
    userStats,
    userBadges,
    allBadges,
  };
};
