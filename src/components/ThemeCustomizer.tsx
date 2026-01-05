import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThemeCustomization } from "@/hooks/useThemeCustomization";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeCustomizer() {
  const { currentTheme, setThemePreset, setCustomColors, presets, loading } = useThemeCustomization();
  const [customPrimary, setCustomPrimary] = useState(currentTheme.customPrimary || "");
  const [customSecondary, setCustomSecondary] = useState(currentTheme.customSecondary || "");
  const [customAccent, setCustomAccent] = useState(currentTheme.customAccent || "");
  const [showCustomColors, setShowCustomColors] = useState(false);

  const handleApplyCustomColors = () => {
    setCustomColors(
      customPrimary || undefined,
      customSecondary || undefined,
      customAccent || undefined
    );
  };

  const handleResetToPreset = () => {
    setCustomPrimary("");
    setCustomSecondary("");
    setCustomAccent("");
    setCustomColors(undefined, undefined, undefined);
    setShowCustomColors(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Customization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading theme options...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Customization
        </CardTitle>
        <CardDescription>
          Choose a preset theme or create your own custom color scheme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Themes */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Preset Themes</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {presets.map((preset) => {
              const isActive = currentTheme.preset === preset.id && !currentTheme.customPrimary;
              return (
                <button
                  key={preset.id}
                  onClick={() => setThemePreset(preset.id)}
                  className={cn(
                    "relative rounded-lg border-2 p-3 transition-all hover:scale-105 hover:shadow-lg",
                    isActive
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {isActive && (
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex gap-1 h-8">
                      <div
                        className="flex-1 rounded-sm"
                        style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
                      />
                      <div
                        className="flex-1 rounded-sm"
                        style={{ backgroundColor: `hsl(${preset.colors.secondary})` }}
                      />
                      <div
                        className="flex-1 rounded-sm"
                        style={{ backgroundColor: `hsl(${preset.colors.accent})` }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{preset.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Colors Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Custom Colors</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomColors(!showCustomColors)}
            >
              {showCustomColors ? "Hide" : "Show"} Advanced
            </Button>
          </div>

          {showCustomColors && (
            <div className="space-y-4 p-4 rounded-lg border border-border/60 bg-card/40">
              <p className="text-xs text-muted-foreground">
                Enter HSL values (e.g., "220 90% 56%") to customize individual colors
              </p>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Primary Color (HSL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      placeholder="220 90% 56%"
                      className="flex-1 text-sm"
                    />
                    <div
                      className="w-12 h-10 rounded border border-border"
                      style={{
                        backgroundColor: customPrimary
                          ? `hsl(${customPrimary})`
                          : "hsl(var(--primary))",
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Secondary Color (HSL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={customSecondary}
                      onChange={(e) => setCustomSecondary(e.target.value)}
                      placeholder="262 83% 58%"
                      className="flex-1 text-sm"
                    />
                    <div
                      className="w-12 h-10 rounded border border-border"
                      style={{
                        backgroundColor: customSecondary
                          ? `hsl(${customSecondary})`
                          : "hsl(var(--secondary))",
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Accent Color (HSL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={customAccent}
                      onChange={(e) => setCustomAccent(e.target.value)}
                      placeholder="280 65% 60%"
                      className="flex-1 text-sm"
                    />
                    <div
                      className="w-12 h-10 rounded border border-border"
                      style={{
                        backgroundColor: customAccent
                          ? `hsl(${customAccent})`
                          : "hsl(var(--accent))",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleApplyCustomColors} className="flex-1">
                  Apply Custom Colors
                </Button>
                <Button variant="outline" onClick={handleResetToPreset}>
                  Reset to Preset
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
