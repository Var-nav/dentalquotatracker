import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useEffect } from "react";

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  batch_id: string | null;
  recipient_id: string | null;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export const useMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      batchId,
      recipientId,
    }: {
      content: string;
      batchId?: string;
      recipientId?: string;
    }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          content,
          sender_id: user!.id,
          batch_id: batchId || null,
          recipient_id: recipientId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast.success("Message sent successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
};

export const useMessageReactions = (messageId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reactions, isLoading } = useQuery({
    queryKey: ["message-reactions", messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_reactions")
        .select("*")
        .eq("message_id", messageId);

      if (error) throw error;
      return data as MessageReaction[];
    },
    enabled: !!user && !!messageId,
  });

  const addReactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      const { data, error } = await supabase
        .from("message_reactions")
        .insert({
          message_id: messageId,
          user_id: user!.id,
          reaction_type: reactionType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-reactions", messageId] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to add reaction: " + error.message);
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: async (reactionId: string) => {
      const { error } = await supabase
        .from("message_reactions")
        .delete()
        .eq("id", reactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-reactions", messageId] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to remove reaction: " + error.message);
    },
  });

  return {
    reactions,
    isLoading,
    addReaction: addReactionMutation.mutate,
    removeReaction: removeReactionMutation.mutate,
  };
};
