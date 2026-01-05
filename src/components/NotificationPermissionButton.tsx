import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const NotificationPermissionButton = () => {
  const { permission, supported, requestPermission } = usePushNotifications();

  if (!supported) {
    return null;
  }

  const isGranted = permission === "granted";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isGranted ? "ghost" : "outline"}
            size="icon"
            onClick={requestPermission}
            className={isGranted ? "text-success" : ""}
          >
            {isGranted ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isGranted
              ? "Push notifications enabled"
              : "Enable push notifications"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
