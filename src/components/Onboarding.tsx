import { useState } from "react";
import { Button } from "@/components/ui/button";
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
      <div className="w-full max-w-sm text-center">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-12">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === step ? "w-8 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="p-5 rounded-3xl bg-secondary/60">
            <Icon className="h-10 w-10 text-foreground" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
          {currentStep.title}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-10 max-w-xs mx-auto">
          {currentStep.description}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleNext}
            className="w-full h-12 rounded-full text-base font-medium"
          >
            {step < steps.length - 1 ? (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Get Started"
            )}
          </Button>

          {step < steps.length - 1 && (
            <Button
              variant="ghost"
              onClick={onComplete}
              className="w-full text-muted-foreground hover:text-foreground rounded-full"
            >
              Skip
            </Button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground/60 mt-10">
          Estimate only — not financial advice.
        </p>
      </div>
    </div>
  );
}
