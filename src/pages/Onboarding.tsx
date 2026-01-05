import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const onboardingSchema = z.object({
  role: z.enum(["student", "instructor"]),
});

const OnboardingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [role, setRole] = useState<"student" | "instructor" | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignedBatch, setAssignedBatch] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("role")
          .maybeSingle();

        if (existingRole) {
          navigate("/", { replace: true });
          return;
        }

        // Check if user has been assigned a batch by admin
        const { data: existingBatch } = await supabase
          .from("user_batches")
          .select("batch_id, batches(name)")
          .maybeSingle();

        if (existingBatch) {
          setAssignedBatch((existingBatch.batches as any)?.name || "your assigned batch");
        }
      } catch (err) {
        console.error("Onboarding load error", err);
        toast({
          title: "Error loading data",
          description: "Please refresh the page or try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, toast]);

  const handleSave = async () => {
    if (!user) return;

    const parsed = onboardingSchema.safeParse({ role });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid selection";
      toast({
        title: "Missing information",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: parsed.data.role,
      });
      if (roleError) throw roleError;

      toast({
        title: "Profile updated",
        description: "Your role has been saved.",
      });
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Onboarding save error", err);
      toast({
        title: "Could not save",
        description: err.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-muted-foreground">
        Loading your setup...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-xl border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
            Complete Your Profile
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Select your role to get started with Varshify
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {assignedBatch && (
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Your batch assignment: <strong>{assignedBatch}</strong>
                <br />
                <span className="text-xs text-muted-foreground">
                  Batch assignments are managed by administrators. If you need to change your batch, please contact your admin.
                </span>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Select Your Role</Label>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v as "student" | "instructor")}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2 rounded-lg border border-border/60 bg-card/60 px-4 py-3 hover:border-primary/40 transition-colors">
                <RadioGroupItem value="student" id="role-student" />
                <Label htmlFor="role-student" className="cursor-pointer flex-1">
                  <div>
                    <p className="font-medium">Learner</p>
                    <p className="text-xs text-muted-foreground">Track your clinical cases</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-border/60 bg-card/60 px-4 py-3 hover:border-primary/40 transition-colors">
                <RadioGroupItem value="instructor" id="role-instructor" />
                <Label htmlFor="role-instructor" className="cursor-pointer flex-1">
                  <div>
                    <p className="font-medium">Senior learner</p>
                    <p className="text-xs text-muted-foreground">Supervise and verify cases</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {!assignedBatch && (
            <Alert className="bg-muted/50 border-muted">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                You don't have a batch assignment yet. Your administrator will assign you to a batch soon.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSave}
            disabled={!role || saving}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            {saving ? "Saving..." : "Continue to Dashboard"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPage;
