import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { useApiQuery } from "@/hooks/use-api-query";

vi.mock("@/utils/toast", () => ({
  handleApiError: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe("useApiQuery", () => {
  it("should return data from query function", async () => {
    const fetcher = vi.fn().mockResolvedValue("result");

    const { result } = renderHook(
      () =>
        useApiQuery({
          queryKey: ["sample"],
          queryFn: fetcher,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBe("result");
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("should call handleApiError on failure", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("fail"));
    const handleApiError = (await import("@/utils/toast")).handleApiError as ReturnType<
      typeof vi.fn
    >;

    renderHook(
      () =>
        useApiQuery({
          queryKey: ["error"],
          queryFn: fetcher,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(handleApiError).toHaveBeenCalled();
    });
  });
});
