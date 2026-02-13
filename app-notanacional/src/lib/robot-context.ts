import { AsyncLocalStorage } from "async_hooks";

interface RobotContextStore {
  prestadorId?: string;
}

const robotContext = new AsyncLocalStorage<RobotContextStore>();

export function runWithRobotContext<T>(prestadorId: string, fn: () => Promise<T>): Promise<T> {
  return robotContext.run({ prestadorId }, fn);
}

export function getRobotContextPrestadorId(): string | undefined {
  return robotContext.getStore()?.prestadorId;
}
