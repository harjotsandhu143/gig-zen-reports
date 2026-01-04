import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, PiggyBank, ArrowRight } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: Wallet,
      title: "Track income & expenses in one place",
      description: "Add your earnings from any source — work, side hustles, or freelance gigs. Log expenses to see the full picture.",
    },
    {
      icon: PiggyBank,
      title: "See your usable money + estimated tax to set aside",
      description: "We'll show you what you actually get to keep after expenses and estimated tax. No accounting jargon, just clarity.",
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-0 shadow-lg bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-8 text-center">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Icon className="h-12 w-12 text-primary" />
            </div>
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {currentStep.title}
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleNext}
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
            >
              {step < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Go to Dashboard"
              )}
            </Button>

            {step < steps.length - 1 && (
              <Button
                variant="ghost"
                onClick={onComplete}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Skip
              </Button>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground mt-8">
            Estimate only — not financial advice.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
