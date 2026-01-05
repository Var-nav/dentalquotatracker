import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useMessages } from "@/hooks/useMessages";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MessageComposer = () => {
  const [content, setContent] = useState("");
  const [recipientType, setRecipientType] = useState<"batch" | "student">("batch");
  const [selectedId, setSelectedId] = useState("");
  const { sendMessage, isSending } = useMessages();

  const { data: batches } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("batches").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in(
          "id",
          (
            await supabase
              .from("user_roles")
              .select("user_id")
              .eq("role", "student")
          ).data?.map((r) => r.user_id) || []
        );
      if (error) throw error;
      return data;
    },
  });

  const handleSend = () => {
    if (!content.trim() || !selectedId) return;

    sendMessage(
      {
        content,
        ...(recipientType === "batch"
          ? { batchId: selectedId }
          : { recipientId: selectedId }),
      },
      {
        onSuccess: () => {
          setContent("");
          setSelectedId("");
        },
      }
    );
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Send Message</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            value={recipientType}
            onValueChange={(value: "batch" | "student") => {
              setRecipientType(value);
              setSelectedId("");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="batch">Send to Batch</SelectItem>
              <SelectItem value="student">Send to Learner</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${recipientType}`} />
            </SelectTrigger>
            <SelectContent>
              {recipientType === "batch"
                ? batches?.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))
                : students?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name || "Unnamed Student"}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message here..."
          className="min-h-[120px]"
        />

        <Button
          onClick={handleSend}
          disabled={isSending || !content.trim() || !selectedId}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </div>
    </Card>
  );
};
