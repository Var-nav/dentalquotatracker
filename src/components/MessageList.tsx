import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/hooks/useMessages";
import { useMessageReactions } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { Heart, ThumbsUp, Star, Smile } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserMeta } from "@/hooks/useUserMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const REACTIONS = [
  { type: "like", icon: ThumbsUp, label: "Like" },
  { type: "heart", icon: Heart, label: "Heart" },
  { type: "star", icon: Star, label: "Star" },
  { type: "smile", icon: Smile, label: "Smile" },
];

const MessageReactions = ({ messageId }: { messageId: string }) => {
  const { user } = useAuth();
  const { reactions, addReaction, removeReaction } = useMessageReactions(messageId);

  const getReactionCount = (type: string) => {
    return reactions?.filter((r) => r.reaction_type === type).length || 0;
  };

  const hasUserReacted = (type: string) => {
    return reactions?.some(
      (r) => r.reaction_type === type && r.user_id === user?.id
    );
  };

  const getUserReaction = (type: string) => {
    return reactions?.find(
      (r) => r.reaction_type === type && r.user_id === user?.id
    );
  };

  const handleReactionClick = (type: string) => {
    const userReaction = getUserReaction(type);
    if (userReaction) {
      removeReaction(userReaction.id);
    } else {
      addReaction(type);
    }
  };

  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      {REACTIONS.map(({ type, icon: Icon, label }) => {
        const count = getReactionCount(type);
        const hasReacted = hasUserReacted(type);

        return (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => handleReactionClick(type)}
            className={cn(
              "h-8 gap-1",
              hasReacted && "bg-primary/10 border-primary"
            )}
          >
            <Icon className={cn("h-3 w-3", hasReacted && "text-primary")} />
            {count > 0 && <span className="text-xs">{count}</span>}
          </Button>
        );
      })}
    </div>
  );
};

export const MessageList = () => {
  const { messages, isLoading } = useMessages();
  const { meta } = useUserMeta();

  // Fetch sender names for all messages
  const { data: profiles } = useQuery({
    queryKey: ["message-senders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  if (!messages || messages.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p>No messages yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const sender = profiles?.find((p) => p.id === message.sender_id);
        return (
        <Card key={message.id} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {sender?.full_name || "Senior learner"}
              </span>
              {message.batch_id ? (
                <Badge variant="secondary">Batch Message</Badge>
              ) : (
                <Badge variant="outline">Direct Message</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-sm mb-2">{message.content}</p>
          {meta.role === "student" && (
            <MessageReactions messageId={message.id} />
          )}
        </Card>
        );
      })}
    </div>
  );
};
