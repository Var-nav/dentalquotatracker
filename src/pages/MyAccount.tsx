import { SunMedium, MoonStar, MonitorCog, Mail, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserMeta } from "@/hooks/useUserMeta";
import { useTheme } from "next-themes";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";

const themeOptions = [
  { value: "light", label: "Light", icon: SunMedium },
  { value: "dark", label: "Dark", icon: MoonStar },
  { value: "system", label: "System", icon: MonitorCog },
] as const;

const MyAccountPage = () => {
  const { user } = useAuth();
  const { meta } = useUserMeta();
  const { theme, setTheme, systemTheme } = useTheme();

  const effectiveTheme = theme === "system" ? systemTheme ?? "light" : theme;

  const roleLabel = meta.role
    ? meta.role === "student"
      ? "Student"
      : meta.role === "instructor"
      ? "Instructor"
      : "Admin"
    : "Not set";

  const batchParts: string[] = [];
  if (meta.yearOfStudy) batchParts.push(meta.yearOfStudy);
  if (meta.batchName) batchParts.push(meta.batchName);
  if (meta.intakeLabel || meta.academicYear) {
    batchParts.push([meta.intakeLabel, meta.academicYear].filter(Boolean).join(" "));
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
              My Account
            </span>
            {user?.email && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Role & batch
            </p>
            <p className="text-sm flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {roleLabel}
              </Badge>
              {batchParts.length > 0 && (
                <span className="text-xs text-muted-foreground truncate">
                  {batchParts.join(" · ")}
                </span>
              )}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Active theme
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {effectiveTheme} mode
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Light/Dark Mode</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value || (theme === "system" && opt.value === "system");
            return (
              <Button
                key={opt.value}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2 rounded-full"
                onClick={() => setTheme(opt.value)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{opt.label}</span>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <ThemeCustomizer />
    </div>
  );
};

export default MyAccountPage;
