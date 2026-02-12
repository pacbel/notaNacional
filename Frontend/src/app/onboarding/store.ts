import { create } from "zustand";
import type { PrestadorFormValues } from "@/schemas/prestador";

export type OnboardingStep = "prestador" | "gestor" | "resumo";

export interface GestorFormValues {
  nome: string;
  email: string;
  senha: string;
  codigoMfa: string;
  mfaToken?: string;
  usuarioId?: string;
}

export interface RobotInfoState {
  id: string;
  nome: string;
  clientId: string;
  secret?: string | null;
  scopes: string[];
}

interface OnboardingState {
  step: OnboardingStep;
  prestador?: PrestadorFormValues;
  prestadorId?: string;
  gestor?: GestorFormValues;
  robot?: RobotInfoState;
  setStep: (step: OnboardingStep) => void;
  savePrestador: (values: PrestadorFormValues, metadata?: { id?: string }) => void;
  saveGestor: (values: GestorFormValues) => void;
  setRobot: (robot: RobotInfoState | undefined) => void;
  reset: () => void;
}

const initialState: Pick<OnboardingState, "step" | "prestador" | "prestadorId" | "gestor" | "robot"> = {
  step: "prestador",
  prestador: undefined,
  prestadorId: undefined,
  gestor: undefined,
  robot: undefined,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  savePrestador: (values, metadata) =>
    set({
      prestador: values,
      prestadorId: metadata?.id ?? undefined,
    }),
  saveGestor: (values) => set({ gestor: values }),
  setRobot: (robot) => set({ robot }),
  reset: () => set({ ...initialState }),
}));
