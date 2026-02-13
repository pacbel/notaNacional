"use client";

import { OnboardingStep } from "../store";

interface StepDefinition {
  id: OnboardingStep;
  title: string;
  description?: string;
}

const STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: "prestador",
    title: "Prestador",
    description: "Dados cadastrais e endereço",
  },
  {
    id: "gestor",
    title: "Usuário gestor",
    description: "Credenciais com MFA",
  },
  {
    id: "resumo",
    title: "Resumo",
    description: "Revise e confirme",
  },
];

interface StepIndicatorProps {
  currentStep: OnboardingStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEP_DEFINITIONS.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Progresso do onboarding" className="mb-10">
      <ol className="flex flex-col gap-4 md:flex-row">
        {STEP_DEFINITIONS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <li key={step.id} className="flex-1">
              <div
                className={`rounded-2xl border p-4 transition-colors ${
                  isActive
                    ? "border-primary/80 bg-primary/5 text-primary"
                    : isCompleted
                      ? "border-emerald-400/60 bg-emerald-50 text-emerald-600"
                      : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-5 text-inherit">{step.title}</p>
                    {step.description && (
                      <p className="text-xs text-inherit/80">{step.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
