import { useQuery, UseQueryOptions, QueryKey, UseQueryResult } from "@tanstack/react-query";
import { handleApiError } from "@/utils/toast";

type UseApiQueryOptions<TQueryFnData, TError, TData> = UseQueryOptions<
  TQueryFnData,
  TError,
  TData
> & {
  onError?: (error: TError) => void;
  suppressUnauthorizedToast?: boolean;
};

export function useApiQuery<TQueryFnData, TError = unknown, TData = TQueryFnData>(
  options: UseApiQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> {
  const {
    onError,
    suppressUnauthorizedToast = true,
    ...rest
  } = options;

  return useQuery({
    ...rest,
    onError: (error: TError) => {
      if (onError) {
        onError(error);
      }
      handleApiError(error, undefined, {
        suppressUnauthorizedToast,
      });
    },
  } as UseQueryOptions<TQueryFnData, TError, TData>);
}

export function buildQueryKey(base: QueryKey, params?: Record<string, unknown>) {
  if (!params) {
    return base;
  }

  return [...(Array.isArray(base) ? base : [base]), params];
}
