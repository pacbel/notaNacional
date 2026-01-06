import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { useApiMutation } from "@/hooks/use-api-mutation";

vi.mock("@/utils/toast", () => ({
  handleApiError: vi.fn(),
  handleSuccess: vi.fn(),
}));

const createWrapper = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe("useApiMutation", () => {
  it("should execute mutation and trigger success callback", async () => {
    const mutateFn = vi.fn().mockResolvedValue("ok");
    const onSuccess = vi.fn();
    const handleSuccess = (await import("@/utils/toast")).handleSuccess as ReturnType<
      typeof vi.fn
    >;

    const { result } = renderHook(
      () =>
        useApiMutation(mutateFn, {
          successMessage: "done",
          onSuccess,
        }),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync("payload");

    expect(mutateFn).toHaveBeenCalledWith("payload");
    expect(onSuccess).toHaveBeenCalled();
    expect(handleSuccess).toHaveBeenCalledWith("done");
  });

  it("should handle mutation error", async () => {
    const mutateFn = vi.fn().mockRejectedValue(new Error("fail"));
    const handleApiError = (await import("@/utils/toast")).handleApiError as ReturnType<
      typeof vi.fn
    >;

    const { result } = renderHook(() => useApiMutation(mutateFn), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync("payload")).rejects.toThrow("fail");

    await waitFor(() => {
      expect(handleApiError).toHaveBeenCalled();
    });
  });
});
