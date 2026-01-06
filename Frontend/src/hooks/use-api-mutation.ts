import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  MutationFunction,
} from "@tanstack/react-query";
import { handleApiError, handleSuccess } from "@/utils/toast";

type BaseMutationOptions<TData, TError, TVariables, TContext> = Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  "onSuccess" | "onError"
> & {
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  onError?: (
    error: TError,
    variables: TVariables | undefined,
    context: TContext | undefined
  ) => void;
  successMessage?: string;
};

export function useApiMutation<TData, TError = unknown, TVariables = void, TContext = unknown>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: BaseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { successMessage, onError, onSuccess, ...rest } = options ?? {};

  return useMutation({
    mutationFn,
    ...rest,
    onSuccess: (data, variables, context, _mutation) => {
      if (successMessage) {
        handleSuccess(successMessage);
      }
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context, _mutation) => {
      onError?.(error, variables, context);
      handleApiError(error);
    },
  });
}
