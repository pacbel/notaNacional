import { create } from "zustand";
import type { PrestadorFormValues } from "@/schemas/prestador";
import type { CreatePrestadorDto } from "@/types/prestadores";
import type { CreateRobotClientDto } from "@/types/robot-clients";

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
  prestadorPayload?: CreatePrestadorDto;
  robotPayload?: CreateRobotClientDto;
  gestor?: GestorFormValues;
  robot?: RobotInfoState;
  setStep: (step: OnboardingStep) => void;
  savePrestador: (
    values: PrestadorFormValues,
    metadata?: { id?: string; payload?: CreatePrestadorDto; robotPayload?: CreateRobotClientDto }
  ) => void;
  saveGestor: (values: GestorFormValues) => void;
  setRobot: (robot: RobotInfoState | undefined) => void;
  reset: () => void;
}

const initialState: Pick<
  OnboardingState,
  "step" | "prestador" | "prestadorId" | "prestadorPayload" | "robotPayload" | "gestor" | "robot"
> = {
  step: "prestador",
  prestador: undefined,
  prestadorId: undefined,
  prestadorPayload: undefined,
  robotPayload: undefined,
  gestor: undefined,
  robot: undefined,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  savePrestador: (values, metadata) =>
    set((state) => ({
      prestador: values,
      prestadorId: metadata?.id ?? state.prestadorId,
      prestadorPayload: metadata?.payload ?? state.prestadorPayload,
      robotPayload: metadata?.robotPayload ?? state.robotPayload,
    })),
  saveGestor: (values) => set({ gestor: values }),
  setRobot: (robot) => set({ robot }),
  reset: () => set({ ...initialState }),
}));
