import { MessageComposer } from "@/components/MessageComposer";
import { MessageList } from "@/components/MessageList";
import { useUserMeta } from "@/hooks/useUserMeta";

const Messages = () => {
  const { meta } = useUserMeta();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          {meta.role === "instructor"
            ? "Send messages to learners or batches"
            : "View messages from your senior learners"}
        </p>
      </div>

      {meta.role === "instructor" && (
        <div className="mb-6">
          <MessageComposer />
        </div>
      )}

      <MessageList />
    </div>
  );
};

export default Messages;
