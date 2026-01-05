import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Enter a valid email" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password must be less than 128 characters" }),
});

const AuthPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const parsed = authSchema.safeParse({ email, password });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      toast({
        title: "Invalid details",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/auth`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;

        toast({
          title: "Check your email",
          description:
            "We sent you a confirmation link. After confirming, please log in.",
        });
        setMode("login");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const user = data.user;
      if (!user) {
        throw new Error("Login failed. Please try again.");
      }

      // Check whitelist_invites and auto-assign role/batch/department
      const { data: inviteData } = await supabase
        .from("whitelist_invites")
        .select("assigned_role, assigned_batch, assigned_department")
        .eq("email", user.email)
        .maybeSingle();

      if (inviteData) {
        // Create user_roles entry if not exists
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existingRole) {
          await supabase.from("user_roles").insert({
            user_id: user.id,
            role: inviteData.assigned_role,
          });
        }

        // Create user_batches entry if assigned_batch exists and not already assigned
        if (inviteData.assigned_batch) {
          const { data: existingBatch } = await supabase
            .from("user_batches")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!existingBatch) {
            await supabase.from("user_batches").insert({
              user_id: user.id,
              batch_id: inviteData.assigned_batch,
            });
          }
        }

        // Update profile with assigned_department if provided
        if (inviteData.assigned_department) {
          await supabase
            .from("profiles")
            .update({ department_id: inviteData.assigned_department })
            .eq("id", user.id);
        }
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: batchData } = await supabase
        .from("user_batches")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!roleData || !batchData) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      console.error("Auth error", err);
      toast({
        title: "Authentication failed",
        description: err.message ?? "Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google auth error", err);
      toast({
        title: "Google sign-in failed",
        description: err.message ?? "Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <Card className="w-full max-w-md border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-soft animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
            Sign in to your quota dashboard
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Use your email and password to access your batch progress.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "login" | "signup")}
            className="space-y-4"
          >
            <TabsList className="w-full">
              <TabsTrigger value="login" className="w-1/2">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="w-1/2">
                Sign up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button
                className="w-full mt-2"
                onClick={handleAuth}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <Button
                className="w-full mt-2"
                onClick={handleAuth}
                disabled={loading}
              >
                {loading ? "Creating account..." : "Sign up"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
