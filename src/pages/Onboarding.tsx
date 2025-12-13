import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Batch {
  id: string;
  name: string;
}

const onboardingSchema = z.object({
  role: z.enum(["student", "instructor"]),
  batchId: z.string().uuid({ message: "Please select a batch" }),
});

const OnboardingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [role, setRole] = useState<"student" | "instructor" | "">("");
  const [batchId, setBatchId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

        const { data: existingBatch } = await supabase
          .from("user_batches")
          .select("batch_id")
          .maybeSingle();

        if (existingRole && existingBatch) {
          navigate("/", { replace: true });
          return;
        }

        const { data: batchRows, error: batchError } = await supabase
          .from("batches")
          .select("id, name")
          .order("name");

        if (batchError) throw batchError;
        setBatches(batchRows ?? []);
      } catch (err) {
        console.error("Onboarding load error", err);
        toast({
          title: "Error loading batches",
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

    const parsed = onboardingSchema.safeParse({ role, batchId });
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

      const { error: batchError } = await supabase.from("user_batches").insert({
        user_id: user.id,
        batch_id: parsed.data.batchId,
      });
      if (batchError) throw batchError;

      toast({
        title: "Profile updated",
        description: "Your role and batch have been saved.",
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <Card className="w-full max-w-xl border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
            Set up your role & batch
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Choose whether you are a student or instructor and select your batch
            (for example, H batch).
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Role</Label>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v as "student" | "instructor")}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                <RadioGroupItem value="student" id="role-student" />
                <Label htmlFor="role-student" className="cursor-pointer">
                  Student
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                <RadioGroupItem value="instructor" id="role-instructor" />
                <Label htmlFor="role-instructor" className="cursor-pointer">
                  Instructor
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Batch</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select your batch (e.g. H batch)" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full mt-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPage;
