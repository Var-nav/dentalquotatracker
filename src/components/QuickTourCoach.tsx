import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserMeta } from "@/hooks/useUserMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const TOUR_STORAGE_KEY = "varshify_quick_tour_seen";

const steps = [
  {
    id: "add-case",
    title: "Add your first case",
    description:
      "Use the Add Case screen to log procedures. Each case automatically tracks towards your quota.",
    route: "/add-case",
    cta: "Go to Add Case",
  },
  {
    id: "history",
    title: "Review your logbook",
    description:
      "The Case History view shows everything you've logged, with edit and export options.",
    route: "/history",
    cta: "Open History",
  },
  {
    id: "analytics",
    title: "Track your progress",
    description:
      "Analytics highlights how you're progressing across departments and batches.",
    route: "/analytics",
    cta: "View Analytics",
  },
];

export const QuickTourCoach = () => {
  const { meta, loading } = useUserMeta();
  const location = useLocation();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (meta.role !== "student") return;

    const seen = window.localStorage.getItem(TOUR_STORAGE_KEY);
    if (!seen) {
      setVisible(true);
    }
  }, [loading, meta.role]);

  const currentStep = steps[stepIndex];

  const handleDismiss = () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setVisible(false);
  };

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((idx) => idx + 1);
    } else {
      handleDismiss();
    }
  };

  const handleGoToStep = () => {
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
    handleNext();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm animate-fade-in-up">
      <Card className="border border-primary/30 bg-gradient-to-br from-card via-primary/10 to-card shadow-soft">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Quick tour • Step {stepIndex + 1} of {steps.length}
              </p>
              <h2 className="text-sm font-semibold text-foreground">
                {currentStep.title}
              </h2>
              <p className="text-xs text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {steps.map((step, index) => (
                  <span
                    key={step.id}
                    className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                      index === stepIndex
                        ? "bg-primary w-3"
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <Button size="sm" className="h-7 px-3 text-xs" onClick={handleGoToStep}>
                {currentStep.cta}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
