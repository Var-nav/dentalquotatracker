import { useLocation } from "react-router-dom";
import { useUserMeta } from "@/hooks/useUserMeta";

const HIDDEN_PATHS = ["/auth", "/onboarding"] as const;

export function UserMetaPill() {
  const location = useLocation();
  const { meta, loading } = useUserMeta();

  if (HIDDEN_PATHS.includes(location.pathname as (typeof HIDDEN_PATHS)[number])) {
    return null;
  }

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-muted/80 px-3 py-1 text-[11px] text-muted-foreground border border-border/60 shadow-sm animate-pulse">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
        <span>Loading context…</span>
      </div>
    );
  }

  const roleLabel = meta.role
    ? meta.role === "student"
      ? "Student"
      : "Instructor"
    : "Role not set";

  const text = meta.batchName ? `${roleLabel} · ${meta.batchName}` : roleLabel;

  return (
    <div className="inline-flex max-w-xs items-center gap-2 rounded-full bg-muted/80 px-3 py-1 text-[11px] text-muted-foreground border border-border/60 shadow-sm backdrop-blur">
      <span className="h-2 w-2 rounded-full bg-primary" />
      <span className="truncate font-medium">{text}</span>
    </div>
  );
}
