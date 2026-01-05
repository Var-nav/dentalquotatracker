import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ("Notification" in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!supported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast({
          title: "Notifications Enabled! 🔔",
          description: "You'll receive updates when your cases are verified.",
        });
      } else {
        toast({
          title: "Notifications Denied",
          description: "You can enable them later in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        title: "Error",
        description: "Could not request notification permission.",
        variant: "destructive",
      });
    }
  };

  const sendLocalNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (!supported) {
      console.warn("Notifications not supported");
      return;
    }

    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    try {
      // Check if we have a service worker for better support
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            ...options,
          });
        });
      } else {
        // Fallback to basic notification
        new Notification(title, {
          body,
          icon: "/favicon.ico",
          ...options,
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  return {
    permission,
    supported,
    requestPermission,
    sendLocalNotification,
  };
};
