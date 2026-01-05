import { LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { UserMetaPill } from "@/components/UserMetaPill";
import { NotificationBell } from "@/components/NotificationBell";
import { NotificationPermissionButton } from "@/components/NotificationPermissionButton";

const HIDDEN_PATHS = ["/auth", "/onboarding"] as const;

export function HeaderUserActions() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, loading } = useAuth();

  if (HIDDEN_PATHS.includes(location.pathname as (typeof HIDDEN_PATHS)[number])) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth", { replace: true });
      toast({
        title: "Signed out",
        description: "You have been logged out of Varshify.",
      });
    } catch (error: any) {
      console.error("Logout error", error);
      toast({
        title: "Logout failed",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <NotificationPermissionButton />
      <NotificationBell />
      <UserMetaPill />
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5 h-8 px-3"
        onClick={handleLogout}
        disabled={loading}
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Logout</span>
      </Button>
    </div>
  );
}
