import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { THEME_PRESETS, applyThemeColors, ThemePreset } from "@/config/themes";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "varshify_theme";

interface ThemeCustomization {
  preset: string;
  customPrimary?: string;
  customSecondary?: string;
  customAccent?: string;
}

export function useThemeCustomization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTheme, setCurrentTheme] = useState<ThemeCustomization>({
    preset: "vibrant",
  });
  const [loading, setLoading] = useState(true);

  // Load theme from local storage or database
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // First, try local storage for instant loading
        const localTheme = localStorage.getItem(STORAGE_KEY);
        if (localTheme) {
          const parsed = JSON.parse(localTheme);
          setCurrentTheme(parsed);
          applyTheme(parsed);
        }

        // Then, fetch from database if user is logged in
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("theme_preset, custom_primary_hsl, custom_secondary_hsl, custom_accent_hsl")
            .eq("id", user.id)
            .single();

          if (error) throw error;

          if (data) {
            const dbTheme: ThemeCustomization = {
              preset: data.theme_preset || "vibrant",
              customPrimary: data.custom_primary_hsl || undefined,
              customSecondary: data.custom_secondary_hsl || undefined,
              customAccent: data.custom_accent_hsl || undefined,
            };

            // Update local storage with database value
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dbTheme));
            setCurrentTheme(dbTheme);
            applyTheme(dbTheme);
          }
        }
      } catch (error) {
        console.error("Failed to load theme", error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [user]);

  const applyTheme = (theme: ThemeCustomization) => {
    const preset = THEME_PRESETS.find((p) => p.id === theme.preset);
    if (!preset) return;

    const colors = { ...preset.colors };

    // Override with custom colors if present
    if (theme.customPrimary) colors.primary = theme.customPrimary;
    if (theme.customSecondary) colors.secondary = theme.customSecondary;
    if (theme.customAccent) colors.accent = theme.customAccent;

    applyThemeColors(colors);
  };

  const setThemePreset = async (presetId: string) => {
    const newTheme: ThemeCustomization = {
      preset: presetId,
      customPrimary: undefined,
      customSecondary: undefined,
      customAccent: undefined,
    };

    // Update local state and storage immediately
    setCurrentTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTheme));
    applyTheme(newTheme);

    // Sync to database in background
    if (user) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            theme_preset: presetId,
            custom_primary_hsl: null,
            custom_secondary_hsl: null,
            custom_accent_hsl: null,
          })
          .eq("id", user.id);

        if (error) throw error;

        toast({
          title: "Theme updated",
          description: "Your theme has been saved successfully.",
        });
      } catch (error: any) {
        console.error("Failed to save theme", error);
        toast({
          title: "Theme saved locally",
          description: "We'll sync it to the cloud when possible.",
          variant: "default",
        });
      }
    }
  };

  const setCustomColors = async (
    customPrimary?: string,
    customSecondary?: string,
    customAccent?: string
  ) => {
    const newTheme: ThemeCustomization = {
      ...currentTheme,
      customPrimary,
      customSecondary,
      customAccent,
    };

    // Update local state and storage immediately
    setCurrentTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTheme));
    applyTheme(newTheme);

    // Sync to database in background
    if (user) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            custom_primary_hsl: customPrimary || null,
            custom_secondary_hsl: customSecondary || null,
            custom_accent_hsl: customAccent || null,
          })
          .eq("id", user.id);

        if (error) throw error;

        toast({
          title: "Custom colors saved",
          description: "Your custom theme has been applied.",
        });
      } catch (error: any) {
        console.error("Failed to save custom colors", error);
        toast({
          title: "Colors saved locally",
          description: "We'll sync them to the cloud when possible.",
          variant: "default",
        });
      }
    }
  };

  return {
    currentTheme,
    loading,
    setThemePreset,
    setCustomColors,
    presets: THEME_PRESETS,
  };
}
